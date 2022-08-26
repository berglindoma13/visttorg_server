import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express';
import { BykoCertificate, BykoProduct, BykoResponseData } from '../types/byko'
import axios from 'axios'
import fs from 'fs'
import BykoCategoryMapper from '../mappers/categories/byko'
import { CertificateValidator } from '../helpers/CertificateValidator'
import { Certificate } from '../types/models'
import BykoCertificateMapper from '../mappers/certificates/byko'

// BYKO COMPANY ID = 1

const prisma = new PrismaClient()
const BykoAPI = "https://byko.is/umhverfisvottadar?password=cert4env"

const mockProduct = {
  id: '12345',
  axId: '',
  retailer: 'BYKO',
  brand: 'Önnur vörumerki',
  prodName: 'Burðarviður 45x95 mm',
  shortDescription: 'Heflað timbur',
  longDescription: 'Burðarviður styrkflokkur C24.',
  metaTitle: 'Styrkleiksflokkað timbur',
  metaKeywords: '',
  prodTypeParent: 'Timbur',
  prodType: 'Burðarviður',
  groupId: 235017,
  groupName: 'Timbur',
  url: 'https://byko.is/leit/vara?ProductID=200907',
  prodImage: '/Admin/Public/GetImage.ashx?width=400&height=400&crop=5&Compression=75&DoNotUpscale=true&image=/Files/Images/Products/200907___0_fullsize.jpg',
  fscUrl: 'https://byko.is/Files/Files/PDF%20skjol/BREEAM/FSC_certificate_valid_to_31.05.2024.pdf',
  epdUrl: '',
  vocUrl: '',
  certificates: [
    { cert: 'FSC' },
    { cert: 'Leyfilegt í svansvottað hús' },
    { cert: 'BREEAM' }
  ]
}

export const InsertAllBykoProducts = async(req: Request, res: Response) => {
  const bykoData : BykoResponseData | undefined = await requestBykoApi(1);

  //Check if it comes back undefined, then there was an error retreiving the data
  if(!!bykoData){

    //delete all productcertificates so they wont be duplicated and so they are up to date
    await prisma.productcertificate.deleteMany({
      where: {
        connectedproduct: {
          companyid: 1
        }
      }
    })
    
    //process all data and insert into database
    await ProcessForDatabase(bykoData)
    
    //if the json from byko has multiple pages, make sure to call all the pages to get all the products
    if(bykoData.totalPageCount > 1){
      for(var i = 0; i < bykoData.totalPageCount; i++){
        const moreData : BykoResponseData | undefined = await requestBykoApi(i+2)
        if(!!moreData){
          await ProcessForDatabase(moreData)
        }
      }
    }

    return res.end("Successful import");
  }else{
    return res.end("Byko response was invalid");
  }
};

export const TestProduct = async(req: Request, res: Response) => {
  // await UpsertProductInDatabase(mockProduct)

  const products = await prisma.product.findMany({
    where:{ productid : "12345" },
    include: {
      sellingcompany: true,
      categories : true,
      certificates: {
        include: {
          certificate : true
        }
      }
    },
  });

  const certs = await prisma.productcertificate.findFirst({
    where: {
      productid: "12345"
    }
  })

  const allProducts = await prisma.product.findMany({
    where:{ productid : mockProduct.id },
    include: {
      sellingcompany: true,
      categories : true,
      certificates: {
        include: {
          certificate : true
        }
      }
    },
  });


  return res.end('WHOOP')
}

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
  await prisma.product.deleteMany({
    where: {
      companyid: 1
    }
  })
  res.end("All deleted");
}

export const DeleteAllCategories = async(req: Request, res: Response) => {
  await prisma.category.deleteMany({})
  //TOOD - only delete byko categories
  res.end("All deleted");
}

export const DeleteAllProducCertificates = async(req: Request, res: Response) => {
  await prisma.productcertificate.deleteMany({
    where: {
      connectedproduct: {
        companyid: 1
      }
    }
  })
  
  res.end("All Byko product certificates deleted");
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

const ProcessForDatabase = async(data : BykoResponseData) => {
  for(var i = 0; i < data.productList.length; i++){
    //here is a single product
    await UpsertProductInDatabase(data.productList[i])
  }
  // for(var i = 0; i < 100; i++){
  //   await UpsertProductInDatabase(data[i])
  // }
}

//PRODUCT CERTIFICATE ID'S
// EPD = 1
// FSC = 2
// VOC = 3
// SV = 4
// SV_ALLOWED = 5
// BREEAM = 6
// BLENGILL = 7
const CreateProductCertificates = async(product : BykoProduct, productValidatedCertificates: Array<Certificate>) => {
  
  await Promise.all(productValidatedCertificates.map(async (certificate : Certificate) => {
    if(certificate.name === 'EPD'){
      //TODO -> TÉKKA HVORT CONNECTEDPRODUCT = NULL VIRKI EKKI ÖRUGGLEGA RÉTT
      return await prisma.productcertificate.create({
        data: {
          certificate : {
            connect : { id : 1 }
          },
          connectedproduct : {
            connect : { productid : product.id },
          },
          fileurl : product.epdUrl
        }
      }).then((prodcert) => {
        // const obj = { id : prodcert.id }
        // certificateObjectList.push(obj)
      })
    }

    if(certificate.name === 'FSC'){
      return await prisma.productcertificate.create({
        data: {
          certificate : {
            connect : { id : 2 }
          },
          connectedproduct : {
            connect : { productid : product.id },
          },
          fileurl : product.fscUrl
        }
      }).then((prodcert) => {
        // const obj = { id : prodcert.id }
        // certificateObjectList.push(obj)
      })
    }

    if(certificate.name === 'VOC'){
      return await prisma.productcertificate.create({
        data: {
          certificate : {
            connect : { id : 3 }
          },
          connectedproduct : {
            connect : { productid : product.id },
          },
          fileurl : product.vocUrl
        }
      }).then((prodcert) => {
        // const obj = { id : prodcert.id }
        // certificateObjectList.push(obj)
      })
    }

    if(certificate.name === 'SV'){
      return await prisma.productcertificate.create({
        data: {
          certificate : {
            connect : { id : 4 }
          },
          connectedproduct : {
            connect : { productid : product.id },
          }
        }
      }).then((prodcert) => {
        // const obj = { id : prodcert.id }
        // certificateObjectList.push(obj)
      })
    }

    if(certificate.name === 'SV_ALLOWED'){
      return await prisma.productcertificate.create({
        data: {
          certificate : {
            connect : { id : 5 }
          },
          connectedproduct : {
            connect : { productid : product.id },
          }
        }
      }).then((prodcert) => {
        // const obj = { id : prodcert.id }
        // certificateObjectList.push(obj)
      })
    }

    if(certificate.name === 'BREEAM'){
      return await prisma.productcertificate.create({
        data: {
          certificate : {
            connect : { id : 6 }
          },
          connectedproduct : {
            connect : { productid : product.id },
          }
        }
      }).then((prodcert) => {
        // const obj = { id : prodcert.id }
        // certificateObjectList.push(obj)
      })
    }
    if(certificate.name === 'BLENGILL'){
      return await prisma.productcertificate.create({
        data: {
          certificate : {
            connect : { id : 7 }
          },
          connectedproduct : {
            connect : { productid : product.id },
          }
        }
      }).then((prodcert) => {
        // const obj = { id : prodcert.id }
        // certificateObjectList.push(obj)
      })
    }
  })).then(() => {
    
  })
}

const ListCategories = async(data : BykoResponseData) => {
  const filteredProdType = data.productList.filter(product => product.prodTypeParent != 'Fatnaður')
  const prodtypelist = filteredProdType.map(product => product.prodType)

  //Ferðavörur,Útileguvörur,Fatnaður

  const parentprodtypelist = filteredProdType.map(product => product.prodTypeParent)
  const uniqueArrayProdType = prodtypelist.filter(function(item, pos) {
    return prodtypelist.indexOf(item) == pos
  })
  const uniqueArrayParentProdType = parentprodtypelist.filter(function(item, pos) {
    return parentprodtypelist.indexOf(item) == pos;
  })
  fs.writeFile('prodtypes.txt', uniqueArrayProdType.toString(), function(err) {
    if(err){
      return console.error(err)
    }
  })
  fs.writeFile('parentprodtypes.txt', uniqueArrayParentProdType.toString(), function(err) {
    if(err){
      return console.error(err)
    }
  })

}

interface ConnectedCategory {
  name: string
}

const getMappedCategory = (category: string) => {
  const matchedCategory: Array<ConnectedCategory> = []
  const categoryList: Array<string> = category.split(';')
  return new Promise((resolve : (value: Array<ConnectedCategory>) => void, reject) => {
    for (const cat in BykoCategoryMapper) {
      for(const productCategory in categoryList){
        //@ts-ignore
        if(BykoCategoryMapper[cat].includes(categoryList[productCategory])){
          matchedCategory.push({name: cat})
        }
      }
    }
    resolve(matchedCategory)
  })
}

const UpsertProductInDatabase = async(product : BykoProduct) => {

  //Map certificates and validate them before adding to database
  const convertedCertificates: Array<Certificate> = product.certificates.map(certificate => { return {
    //@ts-ignore
    name: BykoCertificateMapper[certificate.cert]} 
  })
  const validatedCertificates = CertificateValidator({ certificates: convertedCertificates, fscUrl: product.fscUrl, epdUrl: product.epdUrl, vocUrl: product.vocUrl })
  
  //If there are not valid certificates on the product, then it should not be in the database
  if(validatedCertificates.length === 0){
    return;
  }

  //map the product category to vistbóks category dictionary
  const mappedCategory: Array<ConnectedCategory> = []
  const prodTypeParentCategories = await getMappedCategory(product.prodTypeParent)
  const prodTypeCategories = await getMappedCategory(product.prodType)
  prodTypeCategories.map(cat => mappedCategory.push(cat))
  prodTypeParentCategories.map(cat => mappedCategory.push(cat))
  
  //Product needs to fit into at least one of our allowed categories
  if(mappedCategory.length > 0){
    //add or edit the product in the database
    await prisma.product.upsert({
      where: {
        productid : product.id
      },
      update: {
        // approved = false
        title: product.prodName,
        productid : product.id,
        sellingcompany: {
          connect: { id : 1}
        },
        categories : {
          connect: mappedCategory
        },
        description : product.longDescription,
        shortdescription : product.shortDescription,
        productimageurl : `https://byko.is/${product.prodImage}`,
        url : product.url,
        brand : product.brand,
        updatedAt: new Date(),
      },
      create: {
        title: product.prodName,
        productid : product.id,
        sellingcompany: {
          connect: { id : 1}
        },
        categories : {
          connect: mappedCategory
        },
        description : product.longDescription,
        shortdescription : product.shortDescription,
        productimageurl : `https://byko.is/${product.prodImage}`,
        url : product.url,
        brand : product.brand,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    //create the product certificates for this specific product
    await CreateProductCertificates(product, validatedCertificates)
  }
}