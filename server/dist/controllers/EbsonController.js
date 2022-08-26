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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAllSheetsCert = exports.DeleteAllSheetsProducts = exports.InsertAllSheetsProducts = void 0;
const g_sheets_api_1 = __importDefault(require("g-sheets-api"));
//@ts-ignore
const file_system_1 = __importDefault(require("file-system"));
const CertificateValidator_1 = require("../helpers/CertificateValidator");
const ValidDate_1 = require("../helpers/ValidDate");
const WriteFile_1 = require("../helpers/WriteFile");
const CreateProductCertificates_1 = require("../helpers/CreateProductCertificates");
// import { prismaInstance } from '../../lib/prisma';
const PrismaHelper_1 = require("../helpers/PrismaHelper");
// company id 3, get data from google sheets and insert into database from Ebson
var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];
const InsertAllSheetsProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get all data from sheets file
    getProducts();
    res.end('All Ebson products inserted');
});
exports.InsertAllSheetsProducts = InsertAllSheetsProducts;
const DeleteAllSheetsProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, PrismaHelper_1.DeleteAllProductsByCompany)(3);
    res.end("All Ebson products deleted");
});
exports.DeleteAllSheetsProducts = DeleteAllSheetsProducts;
const DeleteAllSheetsCert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, PrismaHelper_1.DeleteAllCertByCompany)(3);
    res.end("All Ebson product certificates deleted");
});
exports.DeleteAllSheetsCert = DeleteAllSheetsCert;
const WriteAllFiles = () => __awaiter(void 0, void 0, void 0, function* () {
    if (createdProducts.length > 0) {
        (0, WriteFile_1.WriteFile)("EbsonCreated", createdProducts);
    }
    if (updatedProducts.length > 0) {
        (0, WriteFile_1.WriteFile)("EbsonUpdated", updatedProducts);
    }
    if (productsNotValid.length > 0) {
        (0, WriteFile_1.WriteFile)("EbsonNotValid", productsNotValid);
    }
});
const productsNoLongerComingInWriteFile = (productsNoLongerInDatabase) => __awaiter(void 0, void 0, void 0, function* () {
    // write product info of products no longer coming into the database (and send email to company)
    file_system_1.default.writeFile("writefiles/nolonger.txt", JSON.stringify(productsNoLongerInDatabase));
    // SendEmail("Products no longer coming in from company")
});
// gets all products from online sheets file
const getProducts = () => {
    const options = {
        apiKey: 'AIzaSyAZQk1HLOZhbbIf6DruJMqsK-CBuRPr7Eg',
        sheetId: '1SFHaI8ZqPUrQU3LLgCsrLBUtk4vzyl6_FQ02nm6XehI',
        returnAllResults: false,
    };
    (0, g_sheets_api_1.default)(options, (results) => {
        const allprod = [];
        for (var i = 1; i < results.length; i++) {
            var temp_prod = {
                id: results[i].nr,
                prodName: results[i].name,
                longDescription: results[i].long,
                shortDescription: results[i].short,
                fl: results[i].fl,
                prodImage: results[i].pic,
                url: results[i].link,
                brand: results[i].mark,
                fscUrl: results[i].fsclink,
                epdUrl: results[i].epdlink,
                vocUrl: results[i].voclink,
                ceUrl: results[i].ce,
                certificates: [
                    { name: "fsc", val: results[i].fsc },
                    { name: "epd", val: results[i].epd },
                    { name: "voc", val: results[i].voc },
                    { name: "sv_allowed", val: results[i].sv },
                    { name: "sv", val: results[i].svans },
                    { name: "breeam", val: results[i].breeam },
                    { name: "blengill", val: results[i].blue },
                    { name: "ev", val: results[i].ev },
                    { name: "ce", val: "TRUE" }
                ]
            };
            allprod.push(temp_prod);
        }
        // process for database
        // ProcessForDatabase(allprod);
    }, () => {
        console.error('ERROR');
    });
};
const UpsertProductInDatabase = (product, approved, create, certChange) => __awaiter(void 0, void 0, void 0, function* () {
    // get all product certificates from sheets
    // const convertedCertificates: Array<Certificate> = product.certificates.map(certificate => { 
    //   if(certificate.val=="TRUE") {
    //     return { name: certificate.name.toUpperCase() }
    //   }
    // })
    //TODO ASK MARIA
    const convertedCertificates = product.certificates.filter(certificate => {
        if (certificate.val == "TRUE") {
            return { name: certificate.name.toUpperCase() };
        }
    });
    //@ts-ignore
    Object.keys(convertedCertificates).forEach(key => convertedCertificates[key] === undefined && delete convertedCertificates[key]);
    const validatedCertificates = (0, CertificateValidator_1.CertificateValidator)({ certificates: convertedCertificates, fscUrl: product.fscUrl, epdUrl: product.epdUrl, vocUrl: product.vocUrl, ceUrl: product.ceUrl });
    var validDate = [];
    // no valid certificates for this product
    if (validatedCertificates.length === 0) {
        productsNotValid.push(product);
        return;
    }
    if (create === true) {
        if (validatedCertificates.length !== 0) {
            createdProducts.push(product);
            // check valid date when product is created
            validDate = yield (0, ValidDate_1.ValidDate)(validatedCertificates, product);
        }
    }
    if (certChange === true) {
        //delete all productcertificates so they wont be duplicated and so they are up to date
        (0, PrismaHelper_1.DeleteProductCertificates)(product.id);
        if (validatedCertificates.length !== 0) {
            updatedProducts.push(product);
            // check valid date when the certificates have changed
            validDate = yield (0, ValidDate_1.ValidDate)(validatedCertificates, product);
        }
    }
    // update or create product in database
    yield (0, PrismaHelper_1.UpsertProduct)(product, approved, 3);
    if (certChange === true || create === true) {
        yield (0, CreateProductCertificates_1.CreateProductCertificates)(product, validDate, validatedCertificates);
    }
});
// check if product list database has any products that are not coming from sheets anymore
const isProductListFound = (incomingProducts) => __awaiter(void 0, void 0, void 0, function* () {
    // get all current products from this company
    const currentProducts = yield (0, PrismaHelper_1.GetAllProductsByCompanyid)(3);
    const productsNoLongerInDatabase = currentProducts.filter(curr_prod => {
        const matches = incomingProducts.filter(product => { return curr_prod.productid == product.id; });
        //product was not found in list
        return matches.length === 0;
    });
    productsNoLongerComingInWriteFile(productsNoLongerInDatabase);
    // deleta prodcut from prisma database
    productsNoLongerInDatabase.map(product => {
        (0, PrismaHelper_1.DeleteProduct)(product.productid);
    });
});
const ProcessForDatabase = (products) => __awaiter(void 0, void 0, void 0, function* () {
    // check if product is in database but not coming in from company anymore
    isProductListFound(products);
    products.map((product) => __awaiter(void 0, void 0, void 0, function* () {
        const prod = yield (0, PrismaHelper_1.GetUniqueProduct)(product.id);
        var approved = false;
        var create = false;
        if (prod !== null) {
            approved = !!prod.approved ? prod.approved : false;
            var certChange = false;
            prod.certificates.map((cert) => {
                if (cert.certificateid == 1) {
                    // epd file url is not the same
                    if (cert.fileurl !== product.epdUrl) {
                        certChange = true;
                        approved = false;
                    }
                }
                if (cert.certificateid == 2) {
                    // fsc file url is not the same
                    if (cert.fileurl !== product.fscUrl) {
                        certChange = true;
                        approved = false;
                    }
                }
                if (cert.certificateid == 3) {
                    // voc file url is not the same
                    if (cert.fileurl !== product.vocUrl) {
                        certChange = true;
                        approved = false;
                    }
                }
            });
        }
        else {
            create = true;
            var certChange = true;
        }
        UpsertProductInDatabase(product, approved, create, certChange);
    }));
    // write all appropriate files
    WriteAllFiles();
});
