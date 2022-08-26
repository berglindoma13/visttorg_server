import { TestControllerProduct, validDateObj } from '../types/testResult'
import { Certificate } from '../types/models'
import { prismaInstance } from '../lib/prisma'

interface certificateObject {
  id: number
}

// TODO breyta testControllerProduct í meira general product til að geta notað þetta fall fyrir allt
export const CreateProductCertificates = async(product : TestControllerProduct, validDateCertificates : Array<validDateObj>, productValidatedCertificates: Array<Certificate>) => {
    let certificateObjectList: Array<certificateObject> = [];
    await Promise.all(productValidatedCertificates.map(async (certificate : Certificate) => {
      if(certificate.name === 'EPD'){
        //TODO -> TÉKKA HVORT CONNECTEDPRODUCT = NULL VIRKI EKKI ÖRUGGLEGA RÉTT
        var date = null;
        if(validDateCertificates[0].message === "Valid") {
          date = validDateCertificates[0].date
        }
        return await prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 1 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            },
            fileurl : product.epdUrl,
            validDate : date
          }
        }).then((prodcert) => {
          const obj = { id : prodcert.id }
          certificateObjectList.push(obj)
        })
      }
  
      if(certificate.name === 'FSC'){
        var date = null;
        if(validDateCertificates[1].message === "Valid") {
          date = validDateCertificates[1].date
        }
        return await prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 2 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            },
            fileurl : product.fscUrl,
            validDate : date
          }
        }).then((prodcert) => {
          const obj = { id : prodcert.id }
          certificateObjectList.push(obj)
        })
      }
  
      if(certificate.name === 'VOC'){
        var date = null;
        if(validDateCertificates[2].message === "Valid") {
          date = validDateCertificates[2].date
        }
        return await prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 3 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            },
            fileurl : product.vocUrl,
            validDate : date
          }
        }).then((prodcert) => {
          const obj = { id : prodcert.id }
          certificateObjectList.push(obj)
        })
      }
  
      if(certificate.name === 'SV'){
        return await prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 4 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        }).then((prodcert) => {
          const obj = { id : prodcert.id }
          certificateObjectList.push(obj)
        })
      }
  
      if(certificate.name === 'SV_ALLOWED'){
        return await prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 5 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        }).then((prodcert) => {
          const obj = { id : prodcert.id }
          certificateObjectList.push(obj)
        })
      }
  
      if(certificate.name === 'BREEAM'){
        return await prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 6 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        }).then((prodcert) => {
          const obj = { id : prodcert.id }
          certificateObjectList.push(obj)
        })
      }
      if(certificate.name === 'BLENGILL'){
        return await prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 7 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        }).then((prodcert) => {
          const obj = { id : prodcert.id }
          certificateObjectList.push(obj)
        })
      }
      if(certificate.name === 'EV'){
        return await prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 8 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        }).then((prodcert) => {
          const obj = { id : prodcert.id }
          certificateObjectList.push(obj)
        })
      }
      if(certificate.name === 'CE'){
        return await prismaInstance.productcertificate.create({
          data: {
            certificate : {
              connect : { id : 9 }
            },
            connectedproduct : {
              connect : { productid : product.id },
            }
          }
        }).then((prodcert) => {
          const obj = { id : prodcert.id }
          certificateObjectList.push(obj)
        })
      }
    })).then(() => {
    })
    return certificateObjectList
}