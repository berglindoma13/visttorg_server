import prismaInstance from "../lib/prisma";
import { DatabaseCategory, DatabaseProduct, DatabaseSubCategory } from "../types/models";

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

export const DeleteProduct = async(productId : string, companyId: number) => {
    // delete product with given product id
   return await prismaInstance.product.delete({
      where : { productIdentifier: { productid : productId, companyid: companyId }},
    })
}

export const DeleteProductCertificates = async(productid : string) => {
    return await prismaInstance.productcertificate.deleteMany({
      where: {
        productid : productid
      }
    })
}

export const GetUniqueProduct = async(productId : string, companyId: number) => {
    return await prismaInstance.product.findUnique({
      where : { productIdentifier: { productid : productId, companyid: companyId }},
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

export const UpsertAllCategories = async(categories: Array<DatabaseCategory>) => {
  const allSubCats = categories.map(cat => {
    return cat.subCategories.map(subcat => { return  { ...subcat, parent: cat.name }})
  }).flat()

  await prismaInstance.$transaction(
    categories.map(cat => {
      return prismaInstance.category.upsert({
        where: {
          name: cat.name
        },
        update: {
         name: cat.name
        },
        create: {
          name: cat.name,
        }
      })
    })
  )

  await prismaInstance.$transaction(
    allSubCats.map(subcat => {
      const id = { 'name': subcat.name, 'parentCategoryName': subcat.parent}
      return prismaInstance.subCategory.upsert({
        where : { 
          subCatIdentifier: id
        },
        update: {
          name: subcat.name,
          parentCategoryName: subcat.parent
        },
        create: {
          name: subcat.name,
          parentCategoryName: subcat.parent
        }
      })
    })
  )
  
}