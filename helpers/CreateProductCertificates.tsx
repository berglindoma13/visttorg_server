import { DatabaseCertificate, DatabaseProduct, ValidDateObj } from '../types/models'
import prismaInstance from '../lib/prisma'
import { PrismaPromise } from '@prisma/client'

interface certificateObject {
  id: number
}

export const CreateProductCertificates = (product : DatabaseProduct, validDate : Array<ValidDateObj>, productValidatedCertificate: DatabaseCertificate) => {
      if(productValidatedCertificate.name === 'EPD'){

        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 1 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            },
            fileurl : product.epdUrl,
            validDate : validDate[0].date
          }
        })
      }
  
      else if(productValidatedCertificate.name === 'FSC'){
        var date = null;
        if(validDate[1].message === "Valid") {
          date = validDate[1].date
        }
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 2 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            },
            fileurl : product.fscUrl,
            validDate : validDate[1].date
          }
        })
      }
  
      else if(productValidatedCertificate.name === 'VOC'){
        var date = null;
        if(validDate[2].message === "Valid") {
          date = validDate[2].date
        }
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 3 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            },
            fileurl : product.vocUrl,
            validDate : validDate[2].date
          }
        })
      }
  
      else if(productValidatedCertificate.name === 'SV'){
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 4 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        })
      }
  
      if(productValidatedCertificate.name === 'SV_ALLOWED'){
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 5 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        })
      }
  
      else if(productValidatedCertificate.name === 'BREEAM'){
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 6 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        })
      }
      else if(productValidatedCertificate.name === 'BLENGILL'){
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 7 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        })
      }
      else if(productValidatedCertificate.name === 'EV'){
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 8 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        })
      }
      else if(productValidatedCertificate.name === 'CE'){
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 9 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        })
      }
     else{
        return prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 10 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        })
      }
    
}