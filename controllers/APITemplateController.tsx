import axios from 'axios'
import { DatabaseProduct, DatabaseProductCertificate, ProductWithPropsProps } from '../types/models'
import fs from 'fs'
import { DeleteAllProductsByCompany,
        DeleteAllCertByCompany,
        GetUniqueProduct,
        GetAllInvalidProductCertsByCompany,
} from '../helpers/PrismaHelper'
import { Request, Response } from 'express';
import { getMappedCategory, getMappedCategorySub } from '../helpers/MapCategories'
import { deleteOldProducts, VerifyProduct, WriteAllFiles } from '../helpers/ProductHelper'
import prismaInstance from '../lib/prisma'
import { certIdFinder } from '../mappers/certificates/certificateIds'
import { client } from '../lib/sanity'
import { mapToCertificateSystem } from '../helpers/CertificateValidator';

const APIUrl = "" 
const CompanyID = 10002
const CompanyName = ''

var updatedProducts: Array<DatabaseProduct> = [];
var createdProducts: Array<DatabaseProduct> = [];
var productsNotValid: Array<DatabaseProduct> = [];

//REPLACE this with the product type from the company
interface TemplateProductProps {
  category: Array<string>
  certificates: any
  id: string
  title: string
  longDescription: string
  shortDescription : string
  images: Array<string>
  url: string
  brand: string
  fsc: string
  voc: string
  epd: string
}

//REPLACE this with the mapped certificates and categories
let TemplateCertMapper: any
let TemplateCategoryMapper: any

//REPLACE this with the typed response from the api from the company
interface TemplateResponse {
  products: Array<any>
}

const convertTemplateProductToDatabaseProduct = async(product: TemplateProductProps) => {
  //map the product category to vistbóks category dictionary
  const prodCategories = product.category.map(cat => {
    return cat
  })
  const mappedCategories = getMappedCategory(prodCategories, TemplateCategoryMapper)
  const mappedSubCategories = getMappedCategorySub(prodCategories, TemplateCategoryMapper)

  const uniqueMappedCategories = mappedCategories.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.name === value.name
    ))
  )
  
  const convertedCertificates: Array<string> = product.certificates.map(certificate => { return TemplateCertMapper[certificate.cert] })

  const convertedProduct : DatabaseProduct = {
    id: product.id !== '' ? `${CompanyID}${product.id}` : product.id,
    prodName: product.title,
    longDescription: product.longDescription,
    shortDescription: product.shortDescription,
    fl: uniqueMappedCategories,
    subFl:mappedSubCategories,
    prodImage: product.images[0], // TODO - FIX THIS WHEN WE HAVE THE OPTION OF MULTIPLE IMAGES
    url: product.url,
    brand: product.brand,
    fscUrl: "",
    epdUrl: "",
    vocUrl: "",
    ceUrl: "",
    //TODO - FIX CERTIFICATES IF THEY ADD MORE TYPES OF PRODUCTS
    certificates: [
      product.fsc !== '' ? {name: "FSC"} : null,
      product.epd  !== '' ? { name: "EPD"} : null,
      product.voc  !== '' ? { name: "VOC"} : null,
      convertedCertificates.includes('SV_ALLOWED') ? { name: "SV_ALLOWED"} : null,
      convertedCertificates.includes('SV') ? { name: "SV" } : null,
      convertedCertificates.includes('BREEAM')  ? { name: "BREEAM" } : null,
      convertedCertificates.includes('BLENGILL')  ? { name: "BLENGILL" } : null,
      convertedCertificates.includes('EV')  ? { name: "EV" } : null,
      // results[i].ce  === 'TRUE' ? { name: "CE" } : null
    ].filter(cert => cert !== null)
  }

  return convertedProduct
}

export const InsertAllTemplateProducts = async(req: Request, res: Response) => {
  const Data: TemplateResponse | undefined = await requestTemplateApi();  

  //Check if it comes back undefined, then there was an error retreiving the data
  if(!!Data){

    //process all data and insert into database - first convert to databaseProduct Array
    const allConvertedProducts: Array<DatabaseProduct> = []

    for(var i = 0; i < Data.products.length; i++){
      const convertedProduct = await convertTemplateProductToDatabaseProduct(Data.products[i])
      //here is a single product
      allConvertedProducts.push(convertedProduct)
    }

    await ProcessForDatabase(allConvertedProducts)

    return res.end("Successful import");
  }else{
    return res.end(`${CompanyName} response was invalid`);
  }
};

export const GetAllTemplateCategories = async(req: Request, res: Response) => {
  const Data : TemplateResponse | undefined = await requestTemplateApi();
  if(!!Data){
    await ListCategories(Data)
    //TODO return categories
    res.end("Successfully listed categories and imported into file");
  }
  else{
    res.end("Failed to list categories");
  }
}

export const DeleteAllTemplateProducts = async(req: Request, res: Response) => {
  DeleteAllProductsByCompany(CompanyID)
  res.end(`All ${CompanyName} products deleted`)
}

export const DeleteAllTemplateCert = async(req: Request, res: Response) => {
  DeleteAllCertByCompany(CompanyID)
  res.end(`all product certificates deleted for ${CompanyName}`)
}

const requestTemplateApi = async() => {
  return axios.get(APIUrl).then(response => {
    if (response.status === 200) {
      const data = response;
      return data.data;
    }else{
      console.log(`Error occured : ${response.status} - ${response.statusText}`);
    } 
  });
}

const ListCategories = async(data : TemplateResponse) => {
  const prodtypelist = data.products.map(product => {
    return product.category.map(cat => {
      return cat
    })
  }).flat()

  const uniqueArrayProdType = prodtypelist.filter(function(item, pos) {
    return prodtypelist.indexOf(item) == pos
  })

  fs.writeFile(`writefiles/${CompanyName}Categories.txt`, uniqueArrayProdType.toString(), function(err) {
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
              certificateSystems:{
                connect: systemArray
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
              certificateSystems:{
                connect: systemArray
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
                productIdentifier : { productid: cert.productId, companyid: CompanyID}
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
    WriteAllFiles(createdProducts, updatedProducts, productsNotValid, 'SmithNorland')
  });
}

export const GetAllInvalidTemplateCertificates = async(req,res) => {
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
