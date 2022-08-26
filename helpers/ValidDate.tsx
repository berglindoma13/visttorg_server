const download = require("download");
const pdf = require('pdf-parse');
const fs = require("fs");
import { Certificate } from '../types/models'
import { TestControllerProduct, validDateObj } from '../types/testResult'

const check = ((parsedate : Date) => {
  // check if data extracted from pdf files is valid or not
  if (parsedate > new Date()) {
    return {message: "Valid", date: parsedate}
  }
  else if(parsedate.toString() == "Invalid Date"){
    return {message: "Invalid Date"}
  }
  else {
    return {message: "Expired Date"}
  }
})

// check date on epd/fsc/voc files, takes all validated certificates for product and returns array with all valida dates
export const ValidDate = async(validatedCertificates : Array<Certificate>, product : TestControllerProduct) => {
  var arr = new Array<validDateObj>(3)
  await Promise.all(validatedCertificates.map(async(cert) => {
    if (cert.name === "EPD") {
      await download(product.epdUrl, "dist")
      const url = product.epdUrl.split("/").pop()
      let dataBuffer = fs.readFileSync('dist/' + url); //dist/Sikasil-C%20EPD.pdf

      await pdf(dataBuffer).then(async function(data) {
        const filedate = data.text.split("\n").filter(text=> text.includes("Valid to"))[0].replace("Valid to", ""); 
        const parsedate = new Date(filedate)
        const test = check(parsedate)
        arr[0] = test
      })
    }
    if (cert.name === "FSC") {
      await download(product.fscUrl, "dist")
      const url = product.fscUrl.split("/").pop()
      let dataBuffer = fs.readFileSync('dist/' + url); // dist/FSC_certificate_valid_to_31.05.2024.pdf
      await pdf(dataBuffer).then(async function(data) {
        const filedate = data.text.split("\n").filter(text=> text.includes("valid"))[1].split(" ").at(-1).split("-");
        const swap = ([item0, item1, rest]) => [item1, item0, rest]; 
        const newdate = swap(filedate).join("-")
        const parsedate = new Date(newdate)
        const test = check(parsedate)
        arr[1] = test
      })
    }
    if (cert.name === "VOC") {
      await download(product.vocUrl, "dist")
      const url = product.vocUrl.split("/").pop()
      let dataBuffer = fs.readFileSync('dist/' + url); // dist/Soudabond%20Easy%20-%20EMICODE-Lizenz%203879%20-%202.8.17-e.pdf
      await pdf(dataBuffer).then(async function(data) {
        const filedate = data.text.split("\n").filter(text=> text.includes("valid until"))[0].replace("valid until", '')
        const parsedate = new Date(filedate)
        const test = check(parsedate)
        arr[2] = test
      })
    }
  })).catch((err) => console.error(err))
  return arr
}


