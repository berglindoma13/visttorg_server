import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { DatabaseCertificate, DatabseProduct } from '../types/models'
import { CertificateValidator } from '../helpers/CertificateValidator'
import { TestControllerProduct, allProducts, validDateObj } from '../types/testResult'
import { SendEmail } from '../helpers/SendEmail'
import { ValidDate } from '../helpers/ValidDate'
import { WriteFile } from '../helpers/WriteFile'
import { CreateProductCertificates } from '../helpers/CreateProductCertificates'
import { DeleteAllProductsByCompany,
        DeleteAllCertByCompany,
        DeleteProduct, 
        DeleteProductCertificates,
        UpsertProduct,
        GetUniqueProduct,
        GetAllProductsByCompanyid } from '../helpers/PrismaHelper'

// TENGI COMPANY ID = 4

const TengiAPI = "https://api.integrator.is/Products/GetMany/?CompanyId=608c19f3591c2b328096b230&ApiKey=b3a6e86d4d4d6612b55d436f7fa60c65d0f8f217c34ead6333407162d308982b&Status=2&Brands=61efc9d1591c275358c86f84" 

var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];

export const InsertAllTengiProducts = async(req, res) => {
    const tengiData = await requestTengiApi();  
    //process all data and insert into database
    await ProcessForDatabase(tengiData)
    return res.end("We made it! And it's great");
};

export const DeleteAllTengiProducts = async(req,res) => {
    // delete all products with company id 4
    DeleteAllProductsByCompany(4)
    res.end("All Tengi products deleted")
}


export const DeleteAllTengiCert = async(req,res) => {
    // delete all product certificates connected to company id 4
    DeleteAllCertByCompany(4)
    res.end("all product certificates deleted for Tengi")
  }

const requestTengiApi = async() => {
  return axios.get(TengiAPI).then(response => {
    if (response.status === 200) {
        // breyta úr any í tengiResponseData
        const data : any = response;
        // console.log('DATA', data.data)
        return data.data;
    }else{
      console.log(`Error occured : ${response.status} - ${response.statusText}`);
    } 
  });
}

// const getcat = async(data) => {
//   var categories = []
//   data.map(prod => {
//     // console.log('prod', prod.fl)
//     prod.fl.map(cat => {
//       // console.log('cat', cat.Name)
//       if(!categories.includes(cat.Name)) {
//         categories.push(cat.Name)
//       }
//     })
//   })
//   console.log(categories)
// }

// // WRITE FILES MISSING HERE

// const next = async(data) => {
//   // console.log('DATA', data)
//   // data.map( => {
//   //   // console.log('her', af.fl)
//   //   getcat(data)
//   // })
//   getcat(data)
// }

const ProcessForDatabase = async(data) => {
  // console.log("DATA NUNA",data.Data)
  const allprod : Array<TestControllerProduct> = [];
  data.Data.map(prod => {
    // console.log('PROD', prod.Attachments)
    var temp_prod : TestControllerProduct = {
      id: prod.Id,
      prodName: prod.StandardFields.Name,
      longDescription: prod.StandardFields.Description,
      shortDescription: prod.StandardFields.ShortDescription,
      fl: prod.StandardFields.Categories,
      prodImage: prod.Images[0].Url,
      url: 'vantar',
      brand: prod.StandardFields.Brands,
      fscUrl: "vantar",
      epdUrl: "vantar",
      vocUrl: "vantar",
      ceUrl: "vantar",
      certificates: [
          { name: "fsc", val:  "FALSE" },
          { name: "epd", val:  "FALSE" },
          { name: "voc", val:  "FALSE" },
          { name: "sv_allowed", val:  "FALSE" },
          { name: "sv", val:  "FALSE" },
          { name: "breeam", val:  "FALSE" },
          { name: "blengill", val:  "FALSE" },
          { name: "ev", val: "FALSE" },
          { name: "ce", val: "TRUE" }
      ]

    }
    allprod.push(temp_prod)
  })
  // console.log('ALL prods', allprod)
//   next(allprod)
}