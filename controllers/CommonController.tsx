import { product } from "@prisma/client"
import { mapToCertificateSystem } from "../helpers/CertificateValidator"
import prismaInstance from "../lib/prisma"
import { client } from "../lib/sanity"
import { SanityCertificate, SanityCertificateListItem, SanityCertificateReference } from "../types/sanity"
import { SendEmailToCompanies } from "../helpers/SendEmail"
import { DatabaseProductCertificate } from "../types/databaseModels"

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
  // sendaInvalidEmail fallið kalla það það
  SendEmailToCompanies();
  res.send('succesfully updated certificates')
}

export const FixValidatedCerts = async(companyName) => {
  //Get the list item from Sanity
  const CertListItem: SanityCertificateListItem = await client.getDocument(`${companyName}CertList`)

  //Get each individual certificate from Sanity
  const referenceList = CertListItem.Certificates.map(cert => cert._ref)
  
  client.getDocuments(referenceList).then(async(reflist: unknown) => {
    const list: Array<SanityCertificate> = reflist as Array<SanityCertificate>

    console.log('list', list)

    const filteredValList = list.filter(x => !!x.validdate)

    await prismaInstance.$transaction(
      filteredValList.map(cert => {  
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
  // sendaInvalidEmail fallið kalla það það
  // SendEmailToCompanies();
}

export const setProductsToCertificateSystems = async(req, res) => {
  const products = await prismaInstance.product.findMany({
    include:{
      certificates: {
        include: {
          certificate : true
        }
      }
    }
  })

  prismaInstance.$transaction(
    products.map(prod => {
        const systemArray = mapToCertificateSystem(prod)
        return prismaInstance.product.update({
          where: {
            productIdentifier: { productid: prod.productid, companyid: prod.companyid }
          },
          data:{
            certificateSystems : {
              connect: systemArray
            }
          }
        })
      })
    )
  res.send('successfull')
}

/*
  This function does:
  1: retreives all certificates from database for a specific company
  2: retreives all certificates from Sanity for a specific company
  3: filters out all Sanity certificates that are no longer in the databse certificate list
  4: removes all perfect duplicates, where the productId and certificate file url are the same
  5: filters out Sanity certificates that have duplicates values in the list but have an older update date
  6: updates the Sanity certifiates list through the Sanity API client
*/
export const DeleteOldSanityEntries = async(companyName: string, companyId: number) => {

  let finalList

  const certificateListDatabase: unknown = await prismaInstance.productcertificate.findMany({
    where: {
      connectedproduct: {
        companyid: companyId
      }
    },
    include:{
      connectedproduct: true,
      certificate:true
    }
  })

  const databaseList = certificateListDatabase as Array<DatabaseProductCertificate>

  const CertListItem: SanityCertificateListItem = await client.getDocument(`${companyName}CertList`)

  //Get each individual certificate from Sanity
  if(!!CertListItem.Certificates && CertListItem.Certificates.length > 0){

    const referenceList = CertListItem.Certificates.map(cert => cert._ref)
    await client.getDocuments(referenceList).then(async(reflist: unknown) => {
      const list: Array<SanityCertificate> = reflist as Array<SanityCertificate>
  
      const certItemsInDatabase = list.filter((listitem: SanityCertificate) => {
        let found = false
  
        databaseList.map((databaseItem: DatabaseProductCertificate) => {
          if(listitem.productid === databaseItem.productid && listitem.certfileurl === databaseItem.fileurl){
            found = true
          }
        })
  
        return found
      })

      const perfectDuplicatesRemoved = certItemsInDatabase.filter((value, index, self) =>
        index === self.findIndex((t) => (
          t.certfileurl === value.certfileurl && t.productid === value.productid && t.validdate === value.validdate
        ))
      )

      const removedOlderCert = perfectDuplicatesRemoved.filter(cert => {
        let foundAndNewer = true
        const myDate = new Date(cert._updatedAt)
        perfectDuplicatesRemoved.map(innercert => {
          const innerDate = new Date(innercert._updatedAt)
          if(innercert.productid === cert.productid && innercert.certfileurl !== cert.certfileurl && innerDate > myDate){
            console.log('found', innercert, '----', cert)
            foundAndNewer = false
          }
        })
        return foundAndNewer
      })

      finalList = removedOlderCert

     })

  
    const sanityCertReferences = []

    const SanityPromises = finalList.map(sanityCert => {
      return client.createIfNotExists(sanityCert).then(createdCert => {
        sanityCertReferences.push({ "_type":"reference", "_ref": createdCert._id })
      }).catch(error => {
        console.log('error', error)
      })
    })
  
    Promise.all(SanityPromises).then(() => {
      client
      .transaction()
      .patch(`${companyName}CertList`, (p) => 
        p.setIfMissing({Certificates: []})
        .insert('replace', 'Certificates[-1]', sanityCertReferences)
      )
      .commit({ autoGenerateArrayKeys: true })
      .then((updatedCert) => {
        console.log('Hurray, the cert is updated! New document:')
        console.log(updatedCert)
      })
      .catch((err) => {
        console.error('Oh no, the update failed: ', err.message)
      })
    })
   }
}

export const CleanUpFunctionSanityCertificates = async(req, res) => {
  const certLists = await client.fetch('*[_type == "CertificateList"]')
  
  const validCertList = certLists.map(listItem => {
    return listItem.Certificates
  })

  const refList = validCertList.map(item => {
    return item.map(i => i._ref)
  }).flat()
   
  const allCerts = await client.fetch('*[_type == "Certificate"]')

  allCerts.map(async(cert, index) => {
    
    if(!refList.includes(cert._id)){
      await client.delete(cert._id)  
    }
  })

  return res.send('success')
}