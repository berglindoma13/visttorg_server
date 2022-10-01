import axios from 'axios'
import { DatabaseProduct, DatabaseProductCertificate, ProductWithPropsProps } from '../types/models'
import fs from 'fs'
import { DeleteAllProductsByCompany,
        DeleteAllCertByCompany,
        GetUniqueProduct,
} from '../helpers/PrismaHelper'
import { SmithNorlandProduct, SmithNorlandResponse } from '../types/smithnorland'
import { Request, Response } from 'express';
import { getMappedCategory, getMappedCategorySub } from '../helpers/MapCategories'
import SmithNorlandCategoryMapper from '../mappers/categories/smithnorland'
import { deleteOldProducts, VerifyProduct, WriteAllFiles } from '../helpers/ProductHelper'
import prismaInstance from '../lib/prisma'
import { certIdFinder } from '../mappers/certificates/certificateIds'

// SmithNorland COMPANY ID = 4

const SmithNorlandAPI = "https://www.sminor.is/visttorg-products" 
const CompanyID = 4

var updatedProducts: Array<DatabaseProduct> = [];
var createdProducts: Array<DatabaseProduct> = [];
var productsNotValid: Array<DatabaseProduct> = [];

const convertSmithNorlandProductToDatabaseProduct = async(product: SmithNorlandProduct) => {

  
  //map the product category to vistbóks category dictionary
  const prodCategories = product.category.map(cat => {
    return cat
  })
  const mappedCategories = getMappedCategory(prodCategories, SmithNorlandCategoryMapper)
  const mappedSubCategories = getMappedCategorySub(prodCategories, SmithNorlandCategoryMapper)

  const uniqueMappedCategories = mappedCategories.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.name === value.name
    ))
  )
  //Map certificates and validate them before adding to database 
  //TODO WHEN THE FIELD IS ADDED TO THE API
  // const convertedCertificates: Array<string> = product.certificates.map(certificate => { return BykoCertificateMapper[certificate.cert] })

  const convertedProduct : DatabaseProduct = {
    id: product.id !== '' ? `${CompanyID}${product.id}` : product.id,
    prodName: product.title,
    longDescription: product.long_description,
    shortDescription: product.short_description,
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
      product.vottun === 'orka' && product.vottunarskjol[0] !== '' ? { name: "ENERGY" } : null,
    ].filter(cert => cert !== null)
  }

  return convertedProduct
}

export const InsertAllSmithNorlandProducts = async(req: Request, res: Response) => {
  const SmithNorlandData : SmithNorlandResponse | undefined = await requestSmithNorlandApi();  

  //Check if it comes back undefined, then there was an error retreiving the data
  if(!!SmithNorlandData){

    //process all data and insert into database - first convert to databaseProduct Array
    const allConvertedSmithNorlandProducts: Array<DatabaseProduct> = []

    for(var i = 0; i < SmithNorlandData.products.length; i++){
      const convertedProduct = await convertSmithNorlandProductToDatabaseProduct(SmithNorlandData.products[i])
      //here is a single product
      allConvertedSmithNorlandProducts.push(convertedProduct)
    }

    await ProcessForDatabase(allConvertedSmithNorlandProducts)

    return res.end("Successful import");
  }else{
    return res.end("SmithNorland response was invalid");
  }
};

export const GetAllSmithNorlandCategories = async(req: Request, res: Response) => {
  const Data : SmithNorlandResponse | undefined = await requestSmithNorlandApi();
  if(!!Data){
    await ListCategories(Data)
    //TODO return categories
    res.end("Successfully listed categories and imported into file");
  }
  else{
    res.end("Failed to list categories");
  }
}

export const DeleteAllSmithNorlandProducts = async(req,res) => {
  // delete all products with company id 3
  DeleteAllProductsByCompany(CompanyID)
  res.end("All SmithNorland products deleted")
}

export const DeleteAllSmithNorlandCert = async(req,res) => {
  // delete all product certificates connected to company id 3
  DeleteAllCertByCompany(CompanyID)
  res.end("all product certificates deleted for SmithNorland")
}

const requestSmithNorlandApi = async() => {
return axios.get(SmithNorlandAPI).then(response => {
  if (response.status === 200) {
    const data = response;
    return data.data;
  }else{
    console.log(`Error occured : ${response.status} - ${response.statusText}`);
  } 
});
}

const ListCategories = async(data : SmithNorlandResponse) => {
  const prodtypelist = data.products.map(product => {
    return product.category.map(cat => {
      return cat
    })
  }).flat()

  const uniqueArrayProdType = prodtypelist.filter(function(item, pos) {
    return prodtypelist.indexOf(item) == pos
  })

  fs.writeFile('writefiles/SmithNorlandCategories.txt', uniqueArrayProdType.toString(), function(err) {
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