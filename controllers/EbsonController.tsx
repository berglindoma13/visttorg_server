import reader from 'g-sheets-api';
//@ts-ignore
import fs from'file-system';
import { DatabaseCertificate, DatabseProduct } from '../types/models'
import { CertificateValidator } from '../helpers/CertificateValidator'
import { validDateObj } from '../types/testResult'
import { SendEmail } from '../helpers/SendEmail'
import { ValidDate } from '../helpers/ValidDate'
import { Request, Response } from 'express';
import { WriteFile } from '../helpers/WriteFile'
import { CreateProductCertificates } from '../helpers/CreateProductCertificates'
// import { prismaInstance } from '../../lib/prisma';
import { DeleteAllProductsByCompany,
        DeleteAllCertByCompany,
        DeleteProduct, 
        DeleteProductCertificates,
        UpsertProduct,
        GetUniqueProduct,
        GetAllProductsByCompanyid } from '../helpers/PrismaHelper'
import { sheetProduct } from '../types/sheets';
import { product } from '@prisma/client';

// company id 3, get data from google sheets and insert into database from Ebson

var updatedProducts: Array<DatabseProduct> = [];
var createdProducts: Array<DatabseProduct> = [];
var productsNotValid: Array<DatabseProduct> = [];

export const InsertAllSheetsProducts = async(req: Request,res: Response) => {
    // get all data from sheets file
    getProducts();
    res.end('All Ebson products inserted')
}

export const DeleteAllSheetsProducts = async(req: Request, res: Response) => {
  DeleteAllProductsByCompany(3)
  res.end("All Ebson products deleted");
}

export const DeleteAllSheetsCert = async(req: Request, res: Response) => {
  DeleteAllCertByCompany(3)
  res.end("All Ebson product certificates deleted");
}

const WriteAllFiles = async() => {
  if (createdProducts.length > 0) {
    WriteFile("EbsonCreated", createdProducts);
  }
  if (updatedProducts.length > 0) {
    WriteFile("EbsonUpdated", updatedProducts);
  }
  if (productsNotValid.length > 0) {
    WriteFile("EbsonNotValid", productsNotValid);
  }
}

const productsNoLongerComingInWriteFile = async(productsNoLongerInDatabase: Array<product>) => {
  // write product info of products no longer coming into the database (and send email to company)
  fs.writeFile("writefiles/nolonger.txt", JSON.stringify(productsNoLongerInDatabase))
  // SendEmail("Products no longer coming in from company")
}

// gets all products from online sheets file
const getProducts = () => {
  const options = {
    apiKey: 'AIzaSyAZQk1HLOZhbbIf6DruJMqsK-CBuRPr7Eg', //google api key in testProject console
    sheetId: '1xyt08puk_-Ox2s-oZESp6iO1sCK8OAQsK1Z9GaovfqQ', //1SFHaI8ZqPUrQU3LLgCsrLBUtk4vzyl6_FQ02nm6XehI // 1mbdkZvGHbBnj4QeOQdfAIQWQ1uOUQdm5aWYmoV
    returnAllResults: false,
  };

  reader(options, (results: Array<sheetProduct>) => {
    const allprod : Array<DatabseProduct> = [];
    for (var i=1; i< results.length; i++) {
      const temp_prod : DatabseProduct = {
          id: results[i].nr,
          prodName: results[i].name,
          longDescription: results[i].long,
          shortDescription: results[i].short,
          fl: results[i].fl,
          prodImage: results[i].pic,
          url: results[i].link,
          brand: results[i].mark,
          fscUrl: results[i].fsclink,
          epdUrl: results[i].epdlink,
          vocUrl: results[i].voclink,
          ceUrl: results[i].ce,
          certificates: [
              results[i].fsc === 'TRUE' ? {name: "FSC"} : null,
              results[i].epd  === 'TRUE' ? { name: "EPD"} : null,
              results[i].voc  === 'TRUE' ? { name: "VOC"} : null,
              results[i].sv  === 'TRUE' ? { name: "SV_ALLOWED"} : null,
              results[i].svans  === 'TRUE' ? { name: "SV" } : null,
              results[i].breeam  === 'TRUE' ? { name: "BREEAM" } : null,
              results[i].blue  === 'TRUE' ? { name: "BLENGILL" } : null,
              results[i].ev  === 'TRUE' ? { name: "EV" } : null,
              results[i].ce  === 'TRUE' ? { name: "CE" } : null
          ].filter(cert => cert !== null)
      }
      allprod.push(temp_prod)

      console.log('temp_prod', temp_prod)
    }
    // process for database
    ProcessForDatabase(allprod);
  }, () => {
    console.error('ERROR')
  });
}

const UpsertProductInDatabase = async(product : DatabseProduct, approved : boolean, create : boolean, certChange : boolean) => {
  // get all product certificates from sheets

  // Object.keys(convertedCertificates).forEach(key => convertedCertificates[key] === undefined && delete convertedCertificates[key]);
  const validatedCertificates = CertificateValidator({ certificates: product.certificates, fscUrl: product.fscUrl, epdUrl: product.epdUrl, vocUrl: product.vocUrl, ceUrl: product.ceUrl })
  
  var validDate: validDateObj[] = []
  // no valid certificates for this product
  if(validatedCertificates.length === 0){
    productsNotValid.push(product)
    return;
  }

  if(create === true) {
    if (validatedCertificates.length !== 0) {
      createdProducts.push(product)
      // check valid date when product is created
      validDate = await ValidDate(validatedCertificates, product)
    }
  }
  if(certChange === true) {
    //delete all productcertificates so they wont be duplicated and so they are up to date
    DeleteProductCertificates(product.id)
    if(validatedCertificates.length !== 0 ) {
      updatedProducts.push(product)
      // check valid date when the certificates have changed
      validDate = await ValidDate(validatedCertificates, product)
    }
  }
  // update or create product in database
  await UpsertProduct(product, approved, 3)
  if(certChange === true || create === true) {
    await CreateProductCertificates(product, validDate, validatedCertificates)
  }
}

// check if product list database has any products that are not coming from sheets anymore
const deleteOldProducts = async(incomingProducts : Array<DatabseProduct>) => {
  // get all current products from this company
  const currentProducts = await GetAllProductsByCompanyid(3)
  const productsNoLongerInDatabase = currentProducts.filter(curr_prod => {
    const matches = incomingProducts.filter(product => { return curr_prod.productid == product.id })
    //product was not found in list
    return matches.length === 0
  })
  productsNoLongerComingInWriteFile(productsNoLongerInDatabase)
  // deleta prodcut from prisma database
  productsNoLongerInDatabase.map(product => {
    DeleteProduct(product.productid)
  })
}

const ProcessForDatabase = async(products : Array<DatabseProduct>) => {
  // check if any product in the list is in database but not coming in from company api anymore
  deleteOldProducts(products)

  products.map(async(product) => {
    const prod = await GetUniqueProduct(product.id)
    var approved = false;
    var create = false
    if (prod !== null){
      approved = !!prod.approved ? prod.approved : false;
      var certChange : boolean = false;
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
      create = true;
      var certChange = true;
    }
    UpsertProductInDatabase(product, approved, create, certChange)
  })
  // write all appropriate files
  WriteAllFiles()
}