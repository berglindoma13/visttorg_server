import { prismaInstance } from "../lib/prisma";
import { TestControllerProduct } from "../types/testResult";

export const DeleteAllProductsByCompany = async(companyid : number) => {
    // delete all products with given company id
    await prismaInstance.product.deleteMany({
      where: {
        companyid: companyid
      }
    })
}
  
export const DeleteAllCertByCompany = async(companyid : number) => {
    // delete all product certificates connected to given company id
    await prismaInstance.productcertificate.deleteMany({
      where: {
        connectedproduct: {
          companyid: companyid
        }
      }
    })
}

export const DeleteProduct = async(productid : string) => {
    // delete product with given product id
    await prismaInstance.product.delete({
      where: {
        productid: productid
      }
    })
}

export const DeleteProductCertificates = async(productid : string) => {
    // delete all product certificates of a specific product i.e from product id and company id
    // await prismaInstance.productcertificate.deleteMany({
    //   where: {
    //     connectedproduct: {
    //       companyid: 2
    //     },
    //     productid : id 
    //   }
    // })
    await prismaInstance.productcertificate.deleteMany({
      where: {
        productid : productid
      }
    })
}

export const UpsertProduct = async(product : TestControllerProduct, approved : boolean, companyid : number) => {
    await prismaInstance.product.upsert({
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
                connect: { name : product.fl}
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
                connect: { name : product.fl}
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

export const GetUniqueProduct = async(productid : string) => {
    return await prismaInstance.product.findUnique({
      where : {productid: productid},
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

