import { Request, Response } from 'express';
import { BykoProduct, BykoResponseData } from '../types/byko'
import axios from 'axios'
import fs from 'fs'
import BykoCategoryMapper from '../mappers/categories/byko'
import BykoCertificateMapper from '../mappers/certificates/byko'
import { DeleteAllProductsByCompany,
  DeleteAllCertByCompany,
  GetUniqueProduct,
  GetAllInvalidProductCertsByCompany,
  DeleteProduct,
  DeleteProductCertificates,
} from '../helpers/PrismaHelper'
import { deleteOldProducts, VerifyProduct, WriteAllFiles } from '../helpers/ProductHelper';
import prismaInstance from '../lib/prisma';
import { certIdFinder } from '../mappers/certificates/certificateIds';
import { getMappedCategory, getMappedCategorySub } from '../helpers/MapCategories';
import { client } from '../lib/sanity';
import { mapToCertificateSystem } from '../helpers/CertificateValidator';
import { ConnectedCategory, ConnectedSubCategory, MigratingProduct, MigratingProductCertificate, ProductWithExtraProps } from '../types/migratingModels';
 
// BYKO COMPANY ID = 1

const BykoAPI = "https://byko.is/umhverfisvottadar?password=cert4env"
const CompanyID = 1
const CompanyName = 'BYKO'

var updatedProducts: Array<MigratingProduct> = [];
var createdProducts: Array<MigratingProduct> = [];
var productsNotValid: Array<MigratingProduct> = [];

const convertBykoProductToDatabaseProduct = async(product: BykoProduct) => {

  //map the product category to vistbóks category dictionary
  // TODO - FIX TO USE THE GENERIC MAPPING FUNCTION - SIMPLIFY
  const mappedCategory: Array<ConnectedCategory> = []
  const prodTypeParentCategories = getMappedCategory(product.prodTypeParent.split(';'), BykoCategoryMapper)
  const prodTypeCategories = getMappedCategory(product.prodType.split(';'), BykoCategoryMapper)
  prodTypeCategories.map(cat => mappedCategory.push(cat))
  prodTypeParentCategories.map(cat => mappedCategory.push(cat))

  const mappedSubCategory: Array<ConnectedSubCategory> = []
  const prodTypeParentSubCategories = getMappedCategorySub(product.prodTypeParent.split(';'), BykoCategoryMapper)
  const prodTypeSubCategories = getMappedCategorySub(product.prodType.split(';'), BykoCategoryMapper)
  prodTypeParentSubCategories.map(cat => mappedSubCategory.push(cat))
  prodTypeSubCategories.map(cat => mappedSubCategory.push(cat))

  //Map certificates and validate them before adding to database
  const convertedCertificates: Array<string> = product.certificates.map(certificate => { return BykoCertificateMapper[certificate.cert] })

  const convertedProduct : MigratingProduct = {
    productid: product.axId !== '' ? `${CompanyID}${product.axId}` : product.axId,
    title: product.prodName,
    description: product.longDescription,
    shortdescription: product.shortDescription,
    categories: mappedCategory,
    subCategories: mappedSubCategory,
    productimageurl: `https://byko.is${product.prodImage}`,
    url: product.url,
    brand: product.brand,
    fscUrl: product.fscUrl,
    epdUrl: product.epdUrl,
    vocUrl: product.vocUrl,
    //fix this when byko adds CE files to the API
    ceUrl: '',
    certificates: [
        product.fscUrl !== '' ? {name: "FSC"} : null,
        product.epdUrl  !== '' ? { name: "EPD"} : null,
        product.vocUrl  !== '' ? { name: "VOC"} : null,
        convertedCertificates.includes('SV_ALLOWED') ? { name: "SV_ALLOWED"} : null,
        convertedCertificates.includes('SV') ? { name: "SV" } : null,
        convertedCertificates.includes('BLENGILL')  ? { name: "BLENGILL" } : null,
        convertedCertificates.includes('EV')  ? { name: "EV" } : null,
        // results[i].ce  === 'TRUE' ? { name: "CE" } : null
    ].filter(cert => cert !== null)
  }

  return convertedProduct
}

export const InsertAllBykoProducts = async(req: Request, res: Response) => {
  const bykoData : BykoResponseData | undefined = await requestBykoApi(1);

  //Check if it comes back undefined, then there was an error retreiving the data
  if(!!bykoData){
    
    //process all data and insert into database - first convert to databaseProduct Array
    const allConvertedBykoProducts = []
    for(var i = 0; i < bykoData.productList.length; i++){
      //here is a single product
      const convertedProduct = await convertBykoProductToDatabaseProduct(bykoData.productList[i])

      //if the product has any matching categories -> add it
      if(convertedProduct.categories.length !== 0){
        allConvertedBykoProducts.push(convertedProduct)
      }
    }

    await ProcessForDatabase(allConvertedBykoProducts)

    return res.end("Successful import");
  }else{
    return res.end("Byko response was invalid");
  }
};

export const GetAllCategories = async(req: Request, res: Response) => {
  const bykoData : BykoResponseData | undefined = await requestBykoApi(1);
  if(!!bykoData){
    await ListCategories(bykoData)
    //TODO return categories
    res.end("Successfully listed categories and imported into file");
  }
  else{
    res.end("Failed to list categories");
  }
}

export const DeleteAllProducts = async(req: Request, res: Response) => {
  await DeleteAllCertByCompany(1)
  await DeleteAllProductsByCompany(1)
  res.end("All deleted");
}

const requestBykoApi = async(pageNr : number) => {
  return axios.get(`${BykoAPI}&PageNum=${pageNr}`).then(response => {
    if (response.status === 200) {
      const data : BykoResponseData = response.data;
      return data;
    }else{
      console.error(`Error occured : ${response.status} - ${response.statusText}`);
    } 
  });
}

const ProcessForDatabase = async(products : Array<MigratingProduct>) => {
  // check if any product in the list is in database but not coming in from company api anymore
  deleteOldProducts(products, CompanyID)

  //Reset global lists
  updatedProducts = [];
  createdProducts = [];
  productsNotValid = []

  const allProductPromises = products.map(async(product) => {
    const productWithProps:ProductWithExtraProps = { approved: false, certChange: false, create: false, product: null, productState: 1, validDate: null, validatedCertificates:[]}
    const prod = await GetUniqueProduct(product.productid, CompanyID)

    var approved = false;
    var created = false
    var certChange = false

    if (prod !== null){
      approved = !!prod.approved ? prod.approved : false;
      const now = new Date()
      prod.certificates.map((cert) => {
        if (cert.certificateid == 1) {
          // epd file url is not the same
          if(cert.fileurl !== product.epdUrl || (cert.validDate !== null && cert.validDate <= now)) {
            certChange = true;
            approved = false;
          }
        }
        if (cert.certificateid == 2) {
          // fsc file url is not the same
          if(cert.fileurl !== product.fscUrl || (cert.validDate !== null && cert.validDate <= now)) {
            certChange = true;
            approved = false;
          }
        }
        if (cert.certificateid == 3) {
          // voc file url is not the same
          if(cert.fileurl !== product.vocUrl || (cert.validDate !== null && cert.validDate <= now)) {
            certChange = true;
            approved = false;
          }
        }
      })
    }
    else {
      created = true;
      //var certChange = true;
    }
    
    productWithProps.approved = approved
    productWithProps.certChange = certChange
    productWithProps.create = created
    productWithProps.product = product

    const productInfo = await VerifyProduct(product, created,  certChange)

    productWithProps.productState = productInfo.productState
    productWithProps.validDate = productInfo.validDate
    productWithProps.validatedCertificates = productInfo.validatedCertificates

    if(productInfo.productState === 1){
      productsNotValid.push(product)
    }else if(productInfo.productState === 2){
      createdProducts.push(product)
    }
    else if(productInfo.productState === 3){
      updatedProducts.push(product)
    }

    return productWithProps
  })
  
  return Promise.all(allProductPromises).then(async(productsWithProps) => {

    const filteredArray = productsWithProps.filter(prod => prod.productState !== 1)

    await prismaInstance.$transaction(
      filteredArray.map(productWithProps => {
        const systemArray = mapToCertificateSystem(productWithProps.product)

        return prismaInstance.product.upsert({
          where: {
            productIdentifier : { productid: productWithProps.product.productid, companyid: CompanyID}
          },
          update: {
              approved: productWithProps.approved,
              title: productWithProps.product.title,
              productid : productWithProps.product.productid,
              sellingcompany: {
                  connect: { id : CompanyID}
              },
              categories : {
                connect: typeof productWithProps.product.categories === 'string' ? { name : productWithProps.product.categories} : productWithProps.product.categories            
              },
              subCategories: {
                connect: productWithProps.product.subCategories
              },
              certificateSystems:{
                connect: systemArray
              },
              description : productWithProps.product.description,
              shortdescription : productWithProps.product.shortdescription,
              productimageurl : productWithProps.product.productimageurl,
              url : productWithProps.product.url,
              brand : productWithProps.product.brand,
              updatedAt: new Date()
          },
          create: {
              title: productWithProps.product.title,
              productid : productWithProps.product.productid,
              sellingcompany: {
                  connect: { id : CompanyID}
              },
              categories : {
                connect: typeof productWithProps.product.categories === 'string' ? { name : productWithProps.product.categories} : productWithProps.product.categories
              },
              subCategories:{
                connect: productWithProps.product.subCategories            
              },
              certificateSystems:{
                connect: systemArray
              },
              description : productWithProps.product.description,
              shortdescription : productWithProps.product.shortdescription,
              productimageurl : productWithProps.product.productimageurl,
              url : productWithProps.product.url,
              brand : productWithProps.product.brand,
              createdAt: new Date(),
              updatedAt: new Date()
          }
        })

      })
    )

    console.log('starting to delete all certs')
    await DeleteAllCertByCompany(CompanyID)

    console.log('done deleting and starting to create new ones')

    const allCertificates: Array<MigratingProductCertificate> = filteredArray.map(prod => {
      return prod.validatedCertificates.map(cert => {
        let fileurl = ''
        let validdate = null
        if(cert.name === 'EPD'){
          fileurl = prod.product.epdUrl
          validdate = prod.validDate[0].date
        }
        else if(cert.name === 'FSC'){
          fileurl = prod.product.fscUrl
          validdate = prod.validDate[1].date
        }
        else if(cert.name === 'VOC'){
          fileurl = prod.product.vocUrl
          validdate = prod.validDate[2].date
        }
        const certItem: MigratingProductCertificate = { 
          name: cert.name,
          fileurl: fileurl,
          validDate: validdate,
          productId: prod.product.productid
        }
        return certItem
      })
    }).flat()

    await prismaInstance.$transaction(
      allCertificates.map(cert => {
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : certIdFinder[cert.name] }
            },
            connectedproduct : {
              connect : { 
                productIdentifier: { productid: cert.productId, companyid: CompanyID }
              },
            },
            fileurl : cert.fileurl,
            validDate : cert.validDate
          }
        })
      })
    ) 
  }).then(() => {
    // write all appropriate files
    WriteAllFiles(createdProducts, updatedProducts, productsNotValid, CompanyName)
  });
}

const ListCategories = async(data : BykoResponseData) => {

  const prodtypelist = data.productList.map(product => product.prodType)
  const parentprodtypelist = data.productList.map(product => product.prodTypeParent)

  const combined = prodtypelist.concat(parentprodtypelist)

  const uniqueArrayProdType = combined.filter(function(item, pos) {
    return combined.indexOf(item) == pos
  })

  const combinedWithReplace = uniqueArrayProdType.toString().replaceAll(';', ',')

  fs.writeFile('writefiles/BykoCategories.txt', combinedWithReplace, function(err) {
    if(err){
      return console.error(err)
    }
  })

}

export const GetAllInvalidBykoCertificates = async(req,res) => {
  const allCerts = await GetAllInvalidProductCertsByCompany(CompanyID)

  const SanityCertArray = allCerts.map(cert => {
    return {
      _id:`${CompanyName}Cert${cert.id}`,
      _type:"Certificate",
      productid:`${cert.productid}`,
      certfileurl:`${cert.fileurl}`,
      checked: false
    }
  })

  const sanityCertReferences = []

  const SanityPromises = SanityCertArray.map(sanityCert => {
    return client.createIfNotExists(sanityCert).then(createdCert => {
      sanityCertReferences.push({ "_type":"reference", "_ref": createdCert._id })
    }).catch(error => {
      console.log('error', error)
    })
  })

  Promise.all(SanityPromises).then(() => {

    //SANITY.IO CREATE CERTIFICATELIST IF IT DOES NOT EXIST
    const doc = {
      _id: `${CompanyName}CertList`,
      _type:"CertificateList",
      CompanyName: CompanyName,
    }
    
    client
    .transaction()
    .createIfNotExists(doc)
    .patch(`${CompanyName}CertList`, (p) => 
      p.setIfMissing({Certificates: []})
      // Add the items after the last item in the array (append)
      .insert('replace', 'Certificates[-1]', sanityCertReferences)
    )
    .commit({ autoGenerateArrayKeys: true })
    .then((updatedCert) => {
      console.log('Hurray, the cert is updated! New document:')
      console.log(updatedCert)
    })
    .catch((err) => {
      console.error('Oh no, the update failed: ', err.message)
    })
  })

  res.end("Successfully logged all invalid certs");
}