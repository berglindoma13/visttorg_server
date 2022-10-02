import { Request, Response } from 'express';
import { BykoProduct, BykoResponseData } from '../types/byko'
import axios from 'axios'
import fs from 'fs'
import BykoCategoryMapper from '../mappers/categories/byko'
import { DatabaseProduct, ConnectedCategory, ProductWithPropsProps, DatabaseProductCertificate, ConnectedSubCategory } from '../types/models'
import BykoCertificateMapper from '../mappers/certificates/byko'
import { DeleteAllProductsByCompany,
  DeleteAllCertByCompany,
  GetUniqueProduct,
  GetAllInvalidProductCertsByCompany,
  GetAllInvalidProductCertsByCompanyAndCertId,
} from '../helpers/PrismaHelper'
import { deleteOldProducts, VerifyProduct, WriteAllFiles } from '../helpers/ProductHelper';
import prismaInstance from '../lib/prisma';
import { certIdFinder } from '../mappers/certificates/certificateIds';
import { getMappedCategory, getMappedCategorySub } from '../helpers/MapCategories';
 
// BYKO COMPANY ID = 1

const BykoAPI = "https://byko.is/umhverfisvottadar?password=cert4env"
const CompanyID = 1

var updatedProducts: Array<DatabaseProduct> = [];
var createdProducts: Array<DatabaseProduct> = [];
var productsNotValid: Array<DatabaseProduct> = [];

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

  const convertedProduct : DatabaseProduct = {
    id: product.axId !== '' ? `${CompanyID}${product.axId}` : product.axId,
    prodName: product.prodName,
    longDescription: product.longDescription,
    shortDescription: product.shortDescription,
    fl: mappedCategory,
    subFl: mappedSubCategory,
    prodImage: `https://byko.is${product.prodImage}`,
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
        convertedCertificates.includes('BREEAM')  ? { name: "BREEAM" } : null,
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
      const convertedProduct = await convertBykoProductToDatabaseProduct(bykoData.productList[i])
      //here is a single product
      allConvertedBykoProducts.push(convertedProduct)
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

const ListCategories = async(data : BykoResponseData) => {
  const filteredProdType = data.productList.filter(product => product.prodTypeParent != 'Fatnaður')
  const prodtypelist = filteredProdType.map(product => product.prodType)
  const parentprodtypelist = filteredProdType.map(product => product.prodTypeParent)

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

export const GetAllInvalidBykoCertificates = async(req, res) => {
  const allCerts = await GetAllInvalidProductCertsByCompany(CompanyID)

  const mapped = allCerts.map(cert => {
    return {
      productid: cert.productid,
      certfileurl: cert.fileurl,
      validDate: cert.validDate
    }
  })

  fs.writeFile('writefiles/bykoinvalidcerts.json', JSON.stringify(mapped) , function(err) {
    if(err){
      return console.error(err)
    }
  })

  res.end("Successfully logged all invalid certs");
}

export const GetAllInvalidBykoCertificatesByCertId = async(req,res) => {
  const allCerts = await GetAllInvalidProductCertsByCompanyAndCertId(CompanyID, 1)

  console.log('allCerts', allCerts)
  console.log('count', allCerts.length)

  fs.writeFile('/writefiles/bykoinvalidcerts.txt', allCerts.toString(), function(err) {
    if(err){
      return console.error(err)
    }
  })

  res.end("Successfully logged all invalid certs");
}

export const UploadBykoValidatedCerts = async(req,res) => {
  fs.readFile('writefiles/BykoFixedCerts.json', async(err, data) => {
    if (err) throw err;
    let datastring: string = data.toString()
    let certlist = JSON.parse(datastring);

    await prismaInstance.$transaction(
      certlist.map(cert => {  
        const swap = ([item0, item1, rest]) => [item1, item0, rest]; 
        const dateOfFileSwapedC = swap(cert.validDate.split(".")).join("-")
        return prismaInstance.productcertificate.updateMany({
          where:{
            productid: cert.productid,
            fileurl: cert.certfileurl
          }, 
          data:{
            validDate: new Date(dateOfFileSwapedC)
          }
        })
      })
    )

    res.send('succesfully updated certificates')
    
});
}