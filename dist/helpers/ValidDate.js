"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidDate = void 0;
const download = require("download");
const pdf = require('pdf-parse');
const fs = require("fs");
const check = ((parsedate) => {
    // check if data extracted from pdf files is valid or not
    if (parsedate > new Date()) {
        return { message: "Valid", date: parsedate };
    }
    else if (parsedate.toString() == "Invalid Date") {
        return { message: "Invalid Date" };
    }
    else {
        return { message: "Expired Date" };
    }
});
// check date on epd/fsc/voc files, takes all validated certificates for product and returns array with all valida dates
const ValidDate = (validatedCertificates, product) => __awaiter(void 0, void 0, void 0, function* () {
    var arr = new Array(3);
    yield Promise.all(validatedCertificates.map((cert) => __awaiter(void 0, void 0, void 0, function* () {
        if (cert.name === "EPD") {
            yield download(product.epdUrl, "dist");
            const url = product.epdUrl.split("/").pop();
            let dataBuffer = fs.readFileSync('dist/' + url); //dist/Sikasil-C%20EPD.pdf
            yield pdf(dataBuffer).then(function (data) {
                return __awaiter(this, void 0, void 0, function* () {
                    const filedate = data.text.split("\n").filter(text => text.includes("Valid to"))[0].replace("Valid to", "");
                    const parsedate = new Date(filedate);
                    const test = check(parsedate);
                    arr[0] = test;
                });
            });
        }
        if (cert.name === "FSC") {
            yield download(product.fscUrl, "dist");
            const url = product.fscUrl.split("/").pop();
            let dataBuffer = fs.readFileSync('dist/' + url); // dist/FSC_certificate_valid_to_31.05.2024.pdf
            yield pdf(dataBuffer).then(function (data) {
                return __awaiter(this, void 0, void 0, function* () {
                    const filedate = data.text.split("\n").filter(text => text.includes("valid"))[1].split(" ").at(-1).split("-");
                    const swap = ([item0, item1, rest]) => [item1, item0, rest];
                    const newdate = swap(filedate).join("-");
                    const parsedate = new Date(newdate);
                    const test = check(parsedate);
                    arr[1] = test;
                });
            });
        }
        if (cert.name === "VOC") {
            yield download(product.vocUrl, "dist");
            const url = product.vocUrl.split("/").pop();
            let dataBuffer = fs.readFileSync('dist/' + url); // dist/Soudabond%20Easy%20-%20EMICODE-Lizenz%203879%20-%202.8.17-e.pdf
            yield pdf(dataBuffer).then(function (data) {
                return __awaiter(this, void 0, void 0, function* () {
                    const filedate = data.text.split("\n").filter(text => text.includes("valid until"))[0].replace("valid until", '');
                    const parsedate = new Date(filedate);
                    const test = check(parsedate);
                    arr[2] = test;
                });
            });
        }
    }))).catch((err) => console.error(err));
    return arr;
});
exports.ValidDate = ValidDate;
