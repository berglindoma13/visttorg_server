import reader from 'g-sheets-api';
import { DatabaseProduct, DatabaseProductCertificate } from '../types/databaseModels'
import { Request, Response } from 'express';
import { DeleteAllProductsByCompany,
        DeleteAllCertByCompany,
        GetUniqueProduct,
        GetAllInvalidProductCertsByCompany,
      } from '../helpers/PrismaHelper'
import fs from 'fs'
import { deleteOldProducts, WriteAllFiles, VerifyProduct, getAllProductsFromGoogleSheets } from '../helpers/ProductHelper';
import prismaInstance from '../lib/prisma';
import { client } from '../lib/sanity';
import { mapToCertificateSystem } from '../helpers/CertificateValidator';
import { certIdFinder } from '../mappers/certificates/certificateIds';
import { MigratingProduct, MigratingProductCertificate, ProductWithExtraProps } from '../types/migratingModels';

//crtl-f Template -> replace with company name

const CompanyID = 9
const SheetID = '1hBZuzrSsIikm-3B_I8uleYx96YQ0KlanGJNLaWLy2q8'
const CompanyName = 'Birgisson'

var updatedProducts: Array<MigratingProduct> = [];
var createdProducts: Array<MigratingProduct> = [];
var productsNotValid: Array<MigratingProduct> = [];

export const InsertAllBirgissonProducts = async(req: Request,res: Response) => {
    // get all data from sheets file
    getAllProductsFromGoogleSheets(SheetID, ProcessForDatabase, CompanyID);
    res.end(`All ${CompanyName} products inserted`)
}

export const DeleteAllBirgissonProducts = async(req: Request, res: Response) => {
  DeleteAllProductsByCompany(CompanyID)
  res.end(`All ${CompanyName} products deleted`);
}

export const DeleteAllBirgissonCert = async(req: Request, res: Response) => {
  DeleteAllCertByCompany(CompanyID)
  res.end(`All ${CompanyName} product certificates deleted`);
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

  Promise.all(allProductPromises).then(async(productsWithProps) => {

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

    // const arrayWithCertifiateChanges = productsWithProps.filter(prod => prod.productState !== 1 && prod.productState !== 4)

    await DeleteAllCertByCompany(CompanyID)


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

export const GetAllInvalidBirgissonCertificates = async(req,res) => {
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
