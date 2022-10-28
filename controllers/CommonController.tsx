import { product } from "@prisma/client"
import { mapToCertificateSystem } from "../helpers/CertificateValidator"
import prismaInstance from "../lib/prisma"
import { client } from "../lib/sanity"
import { SanityCertificate, SanityCertificateListItem, SanityCertificateReference } from "../types/sanity"


export const UploadValidatedCerts = async(req,res) => {
  //Get the list item from Sanity
  const CertListItem: SanityCertificateListItem = req.body.PublishedCertificateListItem

  //Get each individual certificate from Sanity
  const referenceList = CertListItem.Certificates.map(cert => cert._ref)
  client.getDocuments(referenceList).then(async(reflist: unknown) => {
    const list: Array<SanityCertificate> = reflist as Array<SanityCertificate>

    await prismaInstance.$transaction(
      list.map(cert => {  
        return prismaInstance.productcertificate.updateMany({
          where:{
            productid: cert.productid,
            fileurl: cert.certfileurl
          }, 
          data:{
            validDate: new Date(cert.validdate)
          }
        })
      })
    )
  })

  res.send('succesfully updated certificates')
}

// export const setProductsToCertificateSystems = async(req, res) => {
//   const products = await prismaInstance.product.findMany({
//     include:{
//       certificates: {
//         include: {
//           certificate : true
//         }
//       }
//     }
//   })

//   prismaInstance.$transaction(
//     products.map(prod => {
//         const systemArray = mapToCertificateSystem(prod)
//         return prismaInstance.product.update({
//           where: {
//             productIdentifier: { productid: prod.productid, companyid: prod.companyid }
//           },
//           data:{
//             certificateSystems : {
//               connect: systemArray
//             }
//           }
//         })
//       })
//     )
//   res.send('successfull')
// }