import { DatabaseProductCertificate, ValidDateObj } from "../types/databaseModels";
import { CertificateValidator } from "./CertificateValidator";
import { DeleteProductCertificates, GetAllProductsByCompanyid } from "./PrismaHelper";
import { ValidDate } from "./ValidDate";
import { product } from '@prisma/client';
import fs from'file-system';
import { WriteFile } from "./WriteFile";
import prismaInstance from "../lib/prisma";
import reader from 'g-sheets-api';
import { SheetProduct } from "../types/sheets";
import { ConnectedCategory, MigratingProduct } from "../types/migratingModels";

//states for product state
//1 = not valid
//2 = created
//3 = certificate updated
//4 = valid product, no certificate change, not created

export const VerifyProduct = async(product : MigratingProduct, create : boolean, certChange : boolean) => {   
   const validatedCertificates = CertificateValidator({ certificates: product.certificates, fscUrl: product.fscUrl, epdUrl: product.epdUrl, vocUrl: product.vocUrl, ceUrl: product.ceUrl })
   var validDate: ValidDateObj[] = [{ message: '', date: null }, {message: '', date: null}, {message: '', date: null}]
   
   const foundCertWithFiles = validatedCertificates.filter(cert => cert.name === 'EPD' || cert.name === 'FSC' || cert.name === 'VOC').length > 0
   
   var productState = 1
   // no valid certificates for this product
   if(validatedCertificates.length === 0 || product.productid === ""){
     return { productState, validDate: null };
   }
 
   if(create === true) {
    if (validatedCertificates.length !== 0) {
      productState = 2
      // check valid date when product is created
      if(foundCertWithFiles){
        validDate = await ValidDate(validatedCertificates, product) 
      } 
    }
   }
   else if(certChange === true) {
      //delete all productcertificates so they wont be duplicated and so they are up to date
      DeleteProductCertificates(product.productid)
      if(validatedCertificates.length !== 0 ) {
        if (product.productid !== "") {
          productState = 3
          // check valid date when the certificates have changed
          if(foundCertWithFiles){
            validDate = await ValidDate(validatedCertificates, product)
          } 
        }
      }
   }

   productState = 4

   return { productState, validDate, validatedCertificates }
 }

// check if product list database has any products that are not coming from sheets anymore
export const deleteOldProducts = async(products : Array<MigratingProduct>, companyId: number) => {
  console.log('products', products.map(i => i.productid))
  // get all current products from this company
  const currentProducts = await GetAllProductsByCompanyid(companyId)

  console.log('currentproducts', currentProducts.map(i => i.productid))
  const productsNoLongerInDatabase = currentProducts.filter(curr_prod => {
    const matches = products.filter(product => { return curr_prod.productid == product.productid })
    //product was not found in list
    return matches.length === 0
  })

  console.log('productsNoLongerInDatabase', productsNoLongerInDatabase.map(i => i.productid))
  productsNoLongerComingInWriteFile(productsNoLongerInDatabase)

  const transactionPromises = []

  productsNoLongerInDatabase.map(async(product) => {
    transactionPromises.push(await prismaInstance.$transaction([
      prismaInstance.productcertificate.deleteMany({ where: { connectedproduct: { productid: product.productid} }}),
      prismaInstance.product.delete({ where : { productIdentifier: { productid : product.productid, companyid: companyId }}})
    ]))
  })

  await Promise.all(transactionPromises)

}

export const productsNoLongerComingInWriteFile = async(productsNoLongerInDatabase: Array<product>) => {
  // write product info of products no longer coming into the database (and send email to company)
  fs.writeFile("writefiles/nolonger.txt", JSON.stringify(productsNoLongerInDatabase))
  // SendEmail("Products no longer coming in from company")
}

export const WriteAllFiles = async(createdProducts: Array<MigratingProduct>, updatedProducts: Array<MigratingProduct>, productsNotValid: Array<MigratingProduct>, companyName: string, invalidCertificates?: Array<DatabaseProductCertificate>) => {
  WriteFile(`${companyName}Created`, createdProducts);
  WriteFile(`${companyName}Updated`, updatedProducts);
  WriteFile(`${companyName}NotValid`, productsNotValid);
  !!invalidCertificates && WriteFile(`${companyName}InvalidProductCertificates`, invalidCertificates)
}

export const getAllProductsFromGoogleSheets = (sheetId: string, callBack: any, companyID: number) => {
  const options = {
    apiKey: 'AIzaSyAZQk1HLOZhbbIf6DruJMqsK-CBuRPr7Eg', //google api key in testProject console
    sheetId: sheetId,
    returnAllResults: false,
  };

  reader(options, (results: Array<SheetProduct>) => {
    const allprod : Array<MigratingProduct> = [];
    
    for (var i=1; i< results.length; i++) {
      const allCat = results[i].fl ? results[i].fl.split(',') : []
      const mappedCategories: Array<ConnectedCategory> = allCat.map(cat => { return { name: cat } })
  
      const temp_prod : MigratingProduct = {
          productid: results[i].nr !== ''  ? `${companyID}${results[i].nr}` : results[i].nr,
          title: results[i].name,
          description: results[i].long,
          shortdescription: results[i].short,
          categories:mappedCategories,
          subCategories: [],
          productimageurl: results[i].pic,
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
    }
    
    // process for database
    callBack(allprod);
  }, (error) => {
    console.error('ERROR', error)
  });
}