import prismaInstance from "../lib/prisma"
import { client } from "../lib/sanity"
import { SanityCertificate, SanityCertificateListItem, SanityCertificateReference } from "../types/sanity"


export const UploadValidatedCerts = async(req,res) => {
  //Get the list item from Sanity
  const CertListItem: SanityCertificateListItem = req.body.PublishedCertificateListItem

  //Get each individual certificate from Sanity
  const referenceList = CertListItem.Certificates.map(cert => cert._ref)
  client.getDocuments(referenceList).then(async(reflist: unknown) => {
    console.log('reflist', reflist)
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