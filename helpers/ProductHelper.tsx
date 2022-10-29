import { ConnectedCategory, DatabaseProduct, DatabaseProductCertificate, ValidDateObj } from "../types/models";
import { CertificateValidator } from "./CertificateValidator";
import { DeleteProductCertificates, GetAllProductsByCompanyid } from "./PrismaHelper";
import { ValidDate } from "./ValidDate";
import { product } from '@prisma/client';
import fs from'file-system';
import { WriteFile } from "./WriteFile";
import prismaInstance from "../lib/prisma";
import reader from 'g-sheets-api';
import { SheetProduct } from "../types/sheets";

//states for product state
//1 = not valid
//2 = created
//3 = certificate updated
//4 = valid product, no certificate change, not created

export const VerifyProduct = async(product : DatabaseProduct, create : boolean, certChange : boolean) => {   
   const validatedCertificates = CertificateValidator({ certificates: product.certificates, fscUrl: product.fscUrl, epdUrl: product.epdUrl, vocUrl: product.vocUrl, ceUrl: product.ceUrl })
   var validDate: ValidDateObj[] = [{ message: '', date: null }, {message: '', date: null}, {message: '', date: null}]
   
   const foundCertWithFiles = validatedCertificates.filter(cert => cert.name === 'EPD' || cert.name === 'FSC' || cert.name === 'VOC').length > 0
   
   var productState = 1
   // no valid certificates for this product
   if(validatedCertificates.length === 0 || product.id === ""){
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
      DeleteProductCertificates(product.id)
      if(validatedCertificates.length !== 0 ) {
        if (product.id !== "") {
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
export const deleteOldProducts = async(products : Array<DatabaseProduct>, companyId: number) => {
  // get all current products from this company
  const currentProducts = await GetAllProductsByCompanyid(companyId)
  const productsNoLongerInDatabase = currentProducts.filter(curr_prod => {
    const matches = products.filter(product => { return curr_prod.productid == product.id })
    //product was not found in list
    return matches.length === 0
  })
  productsNoLongerComingInWriteFile(productsNoLongerInDatabase)
  // deleta prodcut from prisma database
  await prismaInstance.$transaction(
    productsNoLongerInDatabase.map(product => {
      return prismaInstance.productcertificate.deleteMany({
        where: {
          productid: product.productid
        }
      })
    })
  )

  await prismaInstance.$transaction(
    productsNoLongerInDatabase.map(product => {
      return prismaInstance.product.delete({
        where : { productIdentifier: { productid : product.productid, companyid: companyId }},
      })
    })
  )
}

export const productsNoLongerComingInWriteFile = async(productsNoLongerInDatabase: Array<product>) => {
  // write product info of products no longer coming into the database (and send email to company)
  fs.writeFile("writefiles/nolonger.txt", JSON.stringify(productsNoLongerInDatabase))
  // SendEmail("Products no longer coming in from company")
}

export const WriteAllFiles = async(createdProducts: Array<DatabaseProduct>, updatedProducts: Array<DatabaseProduct>, productsNotValid: Array<DatabaseProduct>, companyName: string, invalidCertificates?: Array<DatabaseProductCertificate>) => {
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
    const allprod : Array<DatabaseProduct> = [];
    
    for (var i=1; i< results.length; i++) {
      const allCat = results[i].fl.split(',')
      const mappedCategories: Array<ConnectedCategory> = allCat.map(cat => { return { name: cat } })
  
      const temp_prod : DatabaseProduct = {
          id: results[i].nr !== ''  ? `${companyID}${results[i].nr}` : results[i].nr,
          prodName: results[i].name,
          longDescription: results[i].long,
          shortDescription: results[i].short,
          fl:mappedCategories,
          subFl: [],
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
    }
    // process for database
    callBack(allprod);
  }, (error) => {
    console.error('ERROR', error)
  });
}