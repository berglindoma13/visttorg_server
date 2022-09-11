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
exports.DeleteAllTengiCert = exports.DeleteAllTengiProducts = exports.InsertAllTengiProducts = void 0;
const axios_1 = __importDefault(require("axios"));
const CertificateValidator_1 = require("../helpers/CertificateValidator");
const ValidDate_1 = require("../helpers/ValidDate");
const CreateProductCertificates_1 = require("../helpers/CreateProductCertificates");
const PrismaHelper_1 = require("../helpers/PrismaHelper");
// TENGI COMPANY ID = 3
const TengiAPI = "https://api.integrator.is/Products/GetMany/?CompanyId=608c19f3591c2b328096b230&ApiKey=b3a6e86d4d4d6612b55d436f7fa60c65d0f8f217c34ead6333407162d308982b&Status=2&Brands=61efc9d1591c275358c86f84";
var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];
const InsertAllTengiProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tengiData = yield requestTengiApi();
    //process all data and insert into database
    yield GetProducts(tengiData);
    return res.end("We made it! And it's great");
});
exports.InsertAllTengiProducts = InsertAllTengiProducts;
const DeleteAllTengiProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all products with company id 3
    (0, PrismaHelper_1.DeleteAllProductsByCompany)(3);
    res.end("All Tengi products deleted");
});
exports.DeleteAllTengiProducts = DeleteAllTengiProducts;
const DeleteAllTengiCert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all product certificates connected to company id 3
    (0, PrismaHelper_1.DeleteAllCertByCompany)(3);
    res.end("all product certificates deleted for Tengi");
});
exports.DeleteAllTengiCert = DeleteAllTengiCert;
const requestTengiApi = () => __awaiter(void 0, void 0, void 0, function* () {
    return axios_1.default.get(TengiAPI).then(response => {
        if (response.status === 200) {
            const data = response;
            return data.data;
        }
        else {
            console.log(`Error occured : ${response.status} - ${response.statusText}`);
        }
    });
});
// const getcat = async(data) => {
// var categories = []
// data.map(prod => {
//   // console.log('prod', prod.fl)
//   prod.fl.map(cat => {
//     // console.log('cat', cat.Name)
//     if(!categories.includes(cat.Name)) {
//       categories.push(cat.Name)
//     }
//   })
// })
// console.log(categories)
// }
// WRITE FILES MISSING HERE
const GetProducts = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("DATA NUNA",data.Data)
    const allprod = [];
    data.Data.map(prod => {
        // console.log('PROD', prod.StandardFields.Categories[1].Name)
        const temp_prod = {
            id: prod.StandardFields.SKU,
            prodName: prod.StandardFields.Name,
            longDescription: prod.StandardFields.Description,
            shortDescription: prod.StandardFields.ShortDescription,
            fl: prod.StandardFields.Categories[1].Name,
            prodImage: prod.Images[0].Url,
            url: 'vantar',
            brand: prod.StandardFields.Brands[0].Name,
            fscUrl: "vantar",
            epdUrl: "vantar",
            vocUrl: "vantar",
            ceUrl: "vantar",
            certificates: [
                'TRUE' === 'TRUE' ? { name: "SV_ALLOWED" } : null,
            ].filter(cert => cert !== null)
        };
        allprod.push(temp_prod);
    });
    // console.log('ALL prods', allprod)
    ProcessForDatabase(allprod);
});
const UpsertProductInDatabase = (product, approved, create, certChange) => __awaiter(void 0, void 0, void 0, function* () {
    // get all product certificates from sheets
    // const convertedCertificates: Array<DatabaseCertificate> = product.certificates.map(certificate => { if(certificate.val=="TRUE") {return {name: certificate.name.toUpperCase() }} })
    // Object.keys(convertedCertificates).forEach(key => convertedCertificates[key] === undefined && delete convertedCertificates[key]);
    const validatedCertificates = (0, CertificateValidator_1.CertificateValidator)({ certificates: product.certificates });
    if (validatedCertificates.length === 0) {
        // no valid certificates for this product
        productsNotValid.push(product);
        return;
    }
    if (create === true) {
        if (validatedCertificates.length !== 0) {
            if (product.id !== "") {
                createdProducts.push(product);
                // check valid date when product is created
                var validDate = yield (0, ValidDate_1.ValidDate)(validatedCertificates, product);
            }
        }
    }
    if (certChange === true) {
        //delete all productcertificates so they wont be duplicated and so they are up to date
        (0, PrismaHelper_1.DeleteProductCertificates)(product.id);
        if (validatedCertificates.length !== 0) {
            if (product.id !== "") {
                updatedProducts.push(product);
                // check valid date when the certificates have changed
                var validDate = yield (0, ValidDate_1.ValidDate)(validatedCertificates, product);
            }
        }
    }
    // update or create product in database if the product has a productnumber (vörunúmer)
    if (product.id !== "") {
        yield (0, PrismaHelper_1.UpsertProduct)(product, approved, 3);
        if (certChange === true || create === true) {
            console.log('og at last komst hingað');
            yield (0, CreateProductCertificates_1.CreateProductCertificates)(product, validDate, validatedCertificates);
        }
    }
});
const isProductListFound = (products) => __awaiter(void 0, void 0, void 0, function* () {
    // get all current products from this company
    const currprods = yield (0, PrismaHelper_1.GetAllProductsByCompanyid)(4);
    const nolonger = currprods.map((curr_prod) => {
        const match = products.map((prod) => {
            if (curr_prod.productid == prod.id) {
                return true;
            }
        });
        if (!match.includes(true)) {
            return curr_prod;
        }
    }).filter(item => item !== undefined);
    // productsNoLongerComingInWriteFile(nolonger)
    // deleta prodcut from prisma database
    nolonger.map(product => {
        (0, PrismaHelper_1.DeleteProduct)(product.productid);
    });
});
const ProcessForDatabase = (products) => __awaiter(void 0, void 0, void 0, function* () {
    // check if product is in database but not coming in from company anymore
    // isProductListFound(products)
    products.map((product) => __awaiter(void 0, void 0, void 0, function* () {
        const prod = yield (0, PrismaHelper_1.GetUniqueProduct)(product.id);
        var approved = null;
        if (prod !== null) {
            approved = prod.approved;
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
            var create = true;
            var certChange = false;
        }
        UpsertProductInDatabase(product, approved, create, certChange);
    }));
    // write all appropriate files
    // WriteAllFiles()
});
