"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProductsFromGoogleSheets = exports.WriteAllFiles = exports.productsNoLongerComingInWriteFile = exports.deleteOldProducts = exports.VerifyProduct = void 0;
const CertificateValidator_1 = require("./CertificateValidator");
const PrismaHelper_1 = require("./PrismaHelper");
const ValidDate_1 = require("./ValidDate");
const file_system_1 = __importDefault(require("file-system"));
const WriteFile_1 = require("./WriteFile");
const prisma_1 = __importDefault(require("../lib/prisma"));
const g_sheets_api_1 = __importDefault(require("g-sheets-api"));
//states for product state
//1 = not valid
//2 = created
//3 = certificate updated
//4 = valid product, no certificate change, not created
const VerifyProduct = async (product, create, certChange) => {
    const validatedCertificates = (0, CertificateValidator_1.CertificateValidator)({ certificates: product.certificates, fscUrl: product.fscUrl, epdUrl: product.epdUrl, vocUrl: product.vocUrl, ceUrl: product.ceUrl });
    var validDate = [{ message: '', date: null }, { message: '', date: null }, { message: '', date: null }];
    const foundCertWithFiles = validatedCertificates.filter(cert => cert.name === 'EPD' || cert.name === 'FSC' || cert.name === 'VOC').length > 0;
    var productState = 1;
    // no valid certificates for this product
    if (validatedCertificates.length === 0 || product.productid === "") {
        return { productState, validDate: null };
    }
    if (create === true) {
        if (validatedCertificates.length !== 0) {
            productState = 2;
            // check valid date when product is created
            if (foundCertWithFiles) {
                validDate = await (0, ValidDate_1.ValidDate)(validatedCertificates, product);
            }
        }
    }
    else if (certChange === true) {
        //delete all productcertificates so they wont be duplicated and so they are up to date
        (0, PrismaHelper_1.DeleteProductCertificates)(product.productid);
        if (validatedCertificates.length !== 0) {
            if (product.productid !== "") {
                productState = 3;
                // check valid date when the certificates have changed
                if (foundCertWithFiles) {
                    validDate = await (0, ValidDate_1.ValidDate)(validatedCertificates, product);
                }
            }
        }
    }
    productState = 4;
    return { productState, validDate, validatedCertificates };
};
exports.VerifyProduct = VerifyProduct;
// check if product list database has any products that are not coming from sheets anymore
const deleteOldProducts = async (products, companyId) => {
    // get all current products from this company
    const currentProducts = await (0, PrismaHelper_1.GetAllProductsByCompanyid)(companyId);
    const productsNoLongerInDatabase = currentProducts.filter(curr_prod => {
        const matches = products.filter(product => { return curr_prod.productid == product.productid; });
        //product was not found in list
        return matches.length === 0;
    });
    (0, exports.productsNoLongerComingInWriteFile)(productsNoLongerInDatabase);
    // deleta prodcut from prisma database
    await prisma_1.default.$transaction(productsNoLongerInDatabase.map(product => {
        return prisma_1.default.productcertificate.deleteMany({
            where: {
                productid: product.productid
            }
        });
    }));
    await prisma_1.default.$transaction(productsNoLongerInDatabase.map(product => {
        return prisma_1.default.product.delete({
            where: { productIdentifier: { productid: product.productid, companyid: companyId } },
        });
    }));
};
exports.deleteOldProducts = deleteOldProducts;
const productsNoLongerComingInWriteFile = async (productsNoLongerInDatabase) => {
    // write product info of products no longer coming into the database (and send email to company)
    file_system_1.default.writeFile("writefiles/nolonger.txt", JSON.stringify(productsNoLongerInDatabase));
    // SendEmail("Products no longer coming in from company")
};
exports.productsNoLongerComingInWriteFile = productsNoLongerComingInWriteFile;
const WriteAllFiles = async (createdProducts, updatedProducts, productsNotValid, companyName, invalidCertificates) => {
    (0, WriteFile_1.WriteFile)(`${companyName}Created`, createdProducts);
    (0, WriteFile_1.WriteFile)(`${companyName}Updated`, updatedProducts);
    (0, WriteFile_1.WriteFile)(`${companyName}NotValid`, productsNotValid);
    !!invalidCertificates && (0, WriteFile_1.WriteFile)(`${companyName}InvalidProductCertificates`, invalidCertificates);
};
exports.WriteAllFiles = WriteAllFiles;
const getAllProductsFromGoogleSheets = (sheetId, callBack, companyID) => {
    const options = {
        apiKey: 'AIzaSyAZQk1HLOZhbbIf6DruJMqsK-CBuRPr7Eg',
        sheetId: sheetId,
        returnAllResults: false,
    };
    (0, g_sheets_api_1.default)(options, (results) => {
        const allprod = [];
        for (var i = 1; i < results.length; i++) {
            const allCat = results[i].fl.split(',');
            const mappedCategories = allCat.map(cat => { return { name: cat }; });
            const temp_prod = {
                productid: results[i].nr !== '' ? `${companyID}${results[i].nr}` : results[i].nr,
                title: results[i].name,
                description: results[i].long,
                shortdescription: results[i].short,
                categories: mappedCategories,
                subCategories: [],
                productimageurl: results[i].pic,
                url: results[i].link,
                brand: results[i].mark,
                fscUrl: results[i].fsclink,
                epdUrl: results[i].epdlink,
                vocUrl: results[i].voclink,
                ceUrl: results[i].ce,
                certificates: [
                    results[i].fsc === 'TRUE' ? { name: "FSC" } : null,
                    results[i].epd === 'TRUE' ? { name: "EPD" } : null,
                    results[i].voc === 'TRUE' ? { name: "VOC" } : null,
                    results[i].sv === 'TRUE' ? { name: "SV_ALLOWED" } : null,
                    results[i].svans === 'TRUE' ? { name: "SV" } : null,
                    results[i].breeam === 'TRUE' ? { name: "BREEAM" } : null,
                    results[i].blue === 'TRUE' ? { name: "BLENGILL" } : null,
                    results[i].ev === 'TRUE' ? { name: "EV" } : null,
                    results[i].ce === 'TRUE' ? { name: "CE" } : null
                ].filter(cert => cert !== null)
            };
            allprod.push(temp_prod);
        }
        // process for database
        callBack(allprod);
    }, (error) => {
        console.error('ERROR', error);
    });
};
exports.getAllProductsFromGoogleSheets = getAllProductsFromGoogleSheets;
