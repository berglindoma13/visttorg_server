import prismaInstance from "../lib/prisma";
import { DatabaseProduct } from "../types/models";

export const DeleteAllProductsByCompany = async(companyid : number) => {
    // delete all products with given company id
    return await prismaInstance.product.deleteMany({
      where: {
        companyid: companyid
      }
    })
}
  
export const DeleteAllCertByCompany = async(companyid : number) => {
    // delete all product certificates connected to given company id
    return await prismaInstance.productcertificate.deleteMany({
      where: {
        connectedproduct: {
          companyid: companyid
        }
      }
    })
}

export const DeleteProduct = async(productid : string) => {
    // delete product with given product id
   return await prismaInstance.product.delete({
      where: {
        productid: productid
      }
    })
}

export const DeleteProductCertificates = async(productid : string) => {
    return await prismaInstance.productcertificate.deleteMany({
      where: {
        productid : productid
      }
    })
}

export const UpsertProduct = async(product : DatabaseProduct, approved : boolean, companyid : number) => {
  return await prismaInstance.product.upsert({
    where: {
      productid : product.id
    },
    update: {
        approved: approved,
        title: product.prodName,
        productid : product.id,
        sellingcompany: {
            connect: { id : companyid}
        },
        categories : {
          connect: typeof product.fl === 'string' ? { name : product.fl} : product.fl            
        },
        description : product.longDescription,
        shortdescription : product.shortDescription,
        productimageurl : product.prodImage,
        url : product.url,
        brand : product.brand,
        updatedAt: new Date()
    },
    create: {
        title: product.prodName,
        productid : product.id,
        sellingcompany: {
            connect: { id : companyid}
        },
        categories : {
          connect: typeof product.fl === 'string' ? { name : product.fl} : product.fl
        },
        description : product.longDescription,
        shortdescription : product.shortDescription,
        productimageurl : product.prodImage,
        url : product.url,
        brand : product.brand,
        createdAt: new Date(),
        updatedAt: new Date()
    }
  })
}

export const GetUniqueProduct = async(productId : string) => {
    return await prismaInstance.product.findUnique({
      where : {productid: productId},
      include : {certificates: {
        include: {
          certificate : true
        }
      }}
    })
}

export const GetAllProductsByCompanyid = async(companyid : number) => {
    return await prismaInstance.product.findMany({
        where : {companyid : companyid}
    })
}

export const GetAllInvalidProductCertsByCompany = async(companyid: number) => {
  return await prismaInstance.productcertificate.findMany({
    where: { 
      validDate: null,
      certificateid: {
        in: [1,2,3]
      },
      connectedproduct: {
        companyid: companyid
      }
    }
  })
}

export const GetAllInvalidProductCertsByCompanyAndCertId = async(companyid: number, certId: number) => {
  return await prismaInstance.productcertificate.findMany({
    where: { 
      validDate: null,
      certificateid: certId,
      connectedproduct: {
        companyid: companyid
      }
    }
  })
}