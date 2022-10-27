import axios from 'axios'
import { DatabaseProduct, DatabaseProductCertificate, ProductWithPropsProps } from '../types/models'
import fs from 'fs'
import { DeleteAllProductsByCompany,
        DeleteAllCertByCompany,
        GetUniqueProduct,
        GetAllInvalidProductCertsByCompany,
 } from '../helpers/PrismaHelper'
import { TengiProduct, TengiResponse } from '../types/tengi'
import { Request, Response } from 'express';
import { getMappedCategory, getMappedCategorySub } from '../helpers/MapCategories'
import TengiCategoryMapper from '../mappers/categories/tengi'
import { deleteOldProducts, VerifyProduct, WriteAllFiles } from '../helpers/ProductHelper'
import prismaInstance from '../lib/prisma'
import { certIdFinder } from '../mappers/certificates/certificateIds'
import { client } from '../lib/sanity'

// TENGI COMPANY ID = 3

const TengiAPI = "https://api.integrator.is/Products/GetMany/?CompanyId=608c19f3591c2b328096b230&ApiKey=b3a6e86d4d4d6612b55d436f7fa60c65d0f8f217c34ead6333407162d308982b&Status=2&Brands=61efc9d1591c275358c86f84" 
const CompanyID = 3
const CompanyName = 'Tengi'


var updatedProducts: Array<DatabaseProduct> = [];
var createdProducts: Array<DatabaseProduct> = [];
var productsNotValid: Array<DatabaseProduct> = [];

const convertTengiProductToDatabaseProduct = async(product: TengiProduct) => {

  
  //map the product category to vistbóks category dictionary
  const prodCategories = product.StandardFields.Categories.map(cat => {
    return cat.Name
  })
  const mappedCategories = getMappedCategory(prodCategories, TengiCategoryMapper)
  const mappedSubCategories = getMappedCategorySub(prodCategories, TengiCategoryMapper)

  //Map certificates and validate them before adding to database 
  //TODO WHEN THE FIELD IS ADDED TO THE API
  // const convertedCertificates: Array<string> = product.certificates.map(certificate => { return BykoCertificateMapper[certificate.cert] })

  const convertedProduct : DatabaseProduct = {
    id: product.StandardFields.SKU !== '' ? `${CompanyID}${product.StandardFields.SKU}` : product.StandardFields.SKU,
    prodName: product.StandardFields.Name,
    longDescription: product.StandardFields.Description,
    shortDescription: product.StandardFields.ShortDescription,
    fl: mappedCategories,
    subFl: mappedSubCategories,
    prodImage: product.Images[0].Url, // TODO - FIX THIS WHEN WE HAVE THE OPTION OF MULTIPLE IMAGES
    url: product.CustomFields.ProductUrl,
    brand: product.StandardFields.Brands[0].Name,
    fscUrl: "",
    epdUrl: "",
    vocUrl: "",
    ceUrl: "",
    //TODO - FIX CERTIFICATES WHEN THEY ARE PUT IN THE API FROM TENGI, AUTOMATICALLY ACCEPTING NOW
    certificates: [
      { name: "SV_ALLOWED"},
    ].filter(cert => cert !== null)
  }

  // console.log('convertedProduct', convertedProduct)

  return convertedProduct
}

export const InsertAllTengiProducts = async(req: Request, res: Response) => {
  const tengiData : TengiResponse | undefined = await requestTengiApi();  

  //Check if it comes back undefined, then there was an error retreiving the data
  if(!!tengiData){

    //process all data and insert into database - first convert to databaseProduct Array
    const allConvertedTengiProducts: Array<DatabaseProduct> = []

    for(var i = 0; i < tengiData.Data.length; i++){
      const convertedProduct = await convertTengiProductToDatabaseProduct(tengiData.Data[i])
      //here is a single product
      allConvertedTengiProducts.push(convertedProduct)
    }

    await ProcessForDatabase(allConvertedTengiProducts)

    return res.end("Successful import");
  }else{
    return res.end("Tengi response was invalid");
  }
};

export const GetAllTengiCategories = async(req: Request, res: Response) => {
  const Data : TengiResponse | undefined = await requestTengiApi();
  if(!!Data){
    await ListCategories(Data)
    //TODO return categories
    res.end("Successfully listed categories and imported into file");
  }
  else{
    res.end("Failed to list categories");
  }
}

export const DeleteAllTengiProducts = async(req,res) => {
  // delete all products with company id 3
  DeleteAllProductsByCompany(CompanyID)
  res.end("All Tengi products deleted")
}

export const DeleteAllTengiCert = async(req,res) => {
  // delete all product certificates connected to company id 3
  DeleteAllCertByCompany(CompanyID)
  res.end("all product certificates deleted for Tengi")
}

const requestTengiApi = async() => {
return axios.get(TengiAPI).then(response => {
  if (response.status === 200) {
    const data = response;
    return data.data;
  }else{
    console.log(`Error occured : ${response.status} - ${response.statusText}`);
  } 
});
}

const ListCategories = async(data : TengiResponse) => {
  const prodtypelist = data.Data.map(product => {
    return product.StandardFields.Categories.map(cat => {
      return cat.Name
    })
  }).flat()

  const uniqueArrayProdType = prodtypelist.filter(function(item, pos) {
    return prodtypelist.indexOf(item) == pos
  })

  fs.writeFile('writefiles/TengiCategories.txt', uniqueArrayProdType.toString(), function(err) {
    if(err){
      return console.error(err)
    }
  })

}

const ProcessForDatabase = async(products : Array<DatabaseProduct>) => {
  // check if any product in the list is in database but not coming in from company api anymore
  deleteOldProducts(products, CompanyID)

  //Reset global lists
  updatedProducts = [];
  createdProducts = [];
  productsNotValid = []


  const allProductPromises = products.map(async(product) => {
    const productWithProps:ProductWithPropsProps = { approved: false, certChange: false, create: false, product: null, productState: 1, validDate: null, validatedCertificates:[]}
    const prod = await GetUniqueProduct(product.id, CompanyID)

    var approved = false;
    var created = false
    var certChange = false

    if (prod !== null){
      approved = !!prod.approved ? prod.approved : false;
      prod.certificates.map((cert) => {
        if (cert.certificateid == 1) {
          // epd file url is not the same
          if(cert.fileurl !== product.epdUrl) {
            certChange = true;
            approved = false;
          }
        }
        if (cert.certificateid == 2) {
          // fsc file url is not the same
          if(cert.fileurl !== product.fscUrl) {
            certChange = true;
            approved = false;
          }
        }
        if (cert.certificateid == 3) {
          // voc file url is not the same
          if(cert.fileurl !== product.vocUrl) {
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

        return prismaInstance.product.upsert({
          where: {
            productIdentifier : { productid: productWithProps.product.id, companyid: CompanyID}
          },
          update: {
              approved: productWithProps.approved,
              title: productWithProps.product.prodName,
              productid : productWithProps.product.id,
              sellingcompany: {
                  connect: { id : CompanyID}
              },
              categories : {
                connect: typeof productWithProps.product.fl === 'string' ? { name : productWithProps.product.fl} : productWithProps.product.fl            
              },
              subCategories: {
                connect: productWithProps.product.subFl
              },
              description : productWithProps.product.longDescription,
              shortdescription : productWithProps.product.shortDescription,
              productimageurl : productWithProps.product.prodImage,
              url : productWithProps.product.url,
              brand : productWithProps.product.brand,
              updatedAt: new Date()
          },
          create: {
              title: productWithProps.product.prodName,
              productid : productWithProps.product.id,
              sellingcompany: {
                  connect: { id : CompanyID}
              },
              categories : {
                connect: typeof productWithProps.product.fl === 'string' ? { name : productWithProps.product.fl} : productWithProps.product.fl
              },
              subCategories:{
                connect: productWithProps.product.subFl            
              },
              description : productWithProps.product.longDescription,
              shortdescription : productWithProps.product.shortDescription,
              productimageurl : productWithProps.product.prodImage,
              url : productWithProps.product.url,
              brand : productWithProps.product.brand,
              createdAt: new Date(),
              updatedAt: new Date()
          }
        })

      })
    )

    await DeleteAllCertByCompany(CompanyID)

    const allCertificates: Array<DatabaseProductCertificate> = filteredArray.map(prod => {
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
        const certItem: DatabaseProductCertificate = { 
          name: cert.name,
          fileurl: fileurl,
          validDate: validdate,
          productId: prod.product.id
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
    WriteAllFiles(createdProducts, updatedProducts, productsNotValid, 'Tengi')
  });
}


export const GetAllInvalidTengiCertificates = async(req,res) => {
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
