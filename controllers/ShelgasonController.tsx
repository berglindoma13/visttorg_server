import reader from 'g-sheets-api';
import { DatabaseProduct, DatabaseProductCertificate, ProductWithPropsProps } from '../types/models'
import { Request, Response } from 'express';
import { DeleteAllProductsByCompany,
        DeleteAllCertByCompany,
        GetUniqueProduct,
        GetAllInvalidProductCertsByCompany
      } from '../helpers/PrismaHelper'
import fs from 'fs'
import { deleteOldProducts, WriteAllFiles, VerifyProduct, getAllProductsFromGoogleSheets } from '../helpers/ProductHelper';
import prismaInstance from '../lib/prisma';
import { certIdFinder } from '../mappers/certificates/certificateIds';

const CompanyID = 5
const SheetID = '1fMgOGGoI20sqTiapQNC-89F9UrrqnvselMnw-OXlgX8'
const CompanyName = 'S.Helgason'

var updatedProducts: Array<DatabaseProduct> = [];
var createdProducts: Array<DatabaseProduct> = [];
var productsNotValid: Array<DatabaseProduct> = [];

export const InsertAllSHelgasonProducts = async(req: Request,res: Response) => {
    // get all data from sheets file
    getAllProductsFromGoogleSheets(SheetID, ProcessForDatabase, CompanyID);
    res.end(`All ${CompanyName} products inserted`)
}

export const DeleteAllSHelgasonProducts = async(req: Request, res: Response) => {
  DeleteAllProductsByCompany(CompanyID)
  res.end(`All ${CompanyName} products deleted`);
}

export const DeleteAllSHelgasonCert = async(req: Request, res: Response) => {
  DeleteAllCertByCompany(CompanyID)
  res.end(`All ${CompanyName} product certificates deleted`);
}

const ProcessForDatabase = async(products : Array<DatabaseProduct>) => {
  // check if any product in the list is in database but not coming in from company api anymore
  deleteOldProducts(products, CompanyID)

  console.log('here')

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
  
  Promise.all(allProductPromises).then(async(productsWithProps) => {

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

   const deletedProductsCerts = await DeleteAllCertByCompany(CompanyID)

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
    WriteAllFiles(createdProducts, updatedProducts, productsNotValid, CompanyName)
  });
}

export const GetAllInvalidSHelgasonCertificates = async(req, res) => {
  const allCerts = await GetAllInvalidProductCertsByCompany(CompanyID)

  console.log('allcerts', allCerts)

  const mapped = allCerts.map(cert => {
    return {
      productid: cert.productid,
      certfileurl: cert.fileurl,
      validDate: cert.validDate
    }
  })

  fs.writeFile('writefiles/SHelgasonInvalidcerts.json', JSON.stringify(mapped) , function(err) {
    if(err){
      return console.error(err)
    }
  })

  res.end("Successfully logged all invalid certs");
}

export const UploadSHelgasonValidatedCerts = async(req,res) => {
  fs.readFile('writefiles/SHelgasonFixedCerts.json', async(err, data) => {
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