const download = require("download");
const pdf = require('pdf-parse');
const fs = require("fs");
import { DatabaseCertificate, DatabaseProduct } from '../types/models'
import { ValidDateObj } from '../types/models'

const check = ((parsedate : Date) => {
  // check if data extracted from pdf files is valid or not
  if (parsedate > new Date()) {
    return {message: "Valid", date: parsedate}
  }
  else if(parsedate.toString() == "Invalid Date"){
    return {message: "Invalid Date", date: null}
  }
  else {
    return {message: "Expired Date", date: null}
  }
})

// check date on epd/fsc/voc files, takes all validated certificates for product and returns array with all valida dates
export const ValidDate = async(validatedCertificates : Array<DatabaseCertificate>, product : DatabaseProduct) => {
  var arr: Array<ValidDateObj> = [{ message: '', date: null }, {message: '', date: null}, {message: '', date: null}]
  await Promise.all(validatedCertificates.map(async(cert) => {
    if (cert.name === "EPD") {
      await download(product.epdUrl, "dist")
      const url = product.epdUrl.split("/").pop()
      let dataBuffer = fs.readFileSync('dist/' + url)
      await pdf(dataBuffer).then(async function(data) {

        let filedatestring
        // let filedate

        //English
        const filedatestringEN = data.text.split("\n").filter(text=> text.includes("Valid to"));
        // const filedatestringDE = data.text.split("\n").filter(text=> text.includes("gültig bis"));

        // new format to test
        const datastring = data.text.split("\n");
        var dateOfFile  = "";
        const filedatestringDIFFERENT = datastring.map((text, index) => {
          if(text.includes("validity period")) {
            dateOfFile=datastring[index+1]
          }
        });

        // filedate = filedatestringEN[0].replace("Valid to", "")
        // if(!!filedatestringEN[0]){
        //   filedatestring = filedatestringEN
        // }else if(!!filedatestringDE[0]){
        //   filedatestring = filedatestringDE
        //   filedate = filedatestring[0].replace("gültig bis", "")
        // }

        if(!!filedatestringEN[0]){
          filedatestring = filedatestringEN[0].replace("Valid to", "")
        }else if(dateOfFile !== ""){
          filedatestring = dateOfFile.replace(/[(,).]/g, " ")
        }

        const parsedate = new Date(filedatestring)
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
      // console.log('VOC VOC VOC VOC --------------------------', product.vocUrl)
      await download(product.vocUrl, "dist")
      const url = product.vocUrl.split("/").pop()
      let dataBuffer = fs.readFileSync('dist/' + url);
      // console.log('databuffer VOC', dataBuffer) // dist/Soudabond%20Easy%20-%20EMICODE-Lizenz%203879%20-%202.8.17-e.pdf
      await pdf(dataBuffer).then(async function(data) {
        // console.log('DATA VOC', data)
        // let filedatestring
        let filedate

        //English
        const filedatestringEN = data.text.split("\n").filter(text=> text.includes("Valid until"));
        // const filedatestringDE = data.text.split("\n").filter(text=> text.includes("gültig bis"));

        filedate = filedatestringEN[0].replace("Valid to", "")
        // console.log('filterdatestinrgDE', filedatestringDE)

        // if(!!filedatestringEN[0]){
        //   filedate = filedatestring[0].replace("Valid to", "")
        // }else if(!!filedatestringDE[0]){
        //   filedatestring = filedatestringDE
        //   filedate = filedatestring[0].replace("gültig bis", "")
        // }
        
        const parsedate = new Date(filedate)
        const test = check(parsedate)
        arr[2] = test
      })
    }
  })).catch((err) => {
    // console.error(err)
  })
  return arr
}


