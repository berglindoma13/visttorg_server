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
exports.DeleteAllEbsonCert = exports.DeleteAllEbsonProducts = exports.InsertAllEbsonProducts = void 0;
const PrismaHelper_1 = require("../helpers/PrismaHelper");
const ProductHelper_1 = require("../helpers/ProductHelper");
const prisma_1 = __importDefault(require("../lib/prisma"));
const certificateIds_1 = require("../mappers/certificates/certificateIds");
// company id 2, get data from google sheets and insert into database from Ebson
const CompanyID = 2;
const SheetID = '1mbdkZvGHbBnj4QeOQdfAIQWQ1uOUQdm5aWYmoV-6yeg';
const CompanyName = 'Ebson';
var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];
const InsertAllEbsonProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get all data from sheets file
    (0, ProductHelper_1.getAllProductsFromGoogleSheets)(SheetID, ProcessForDatabase, CompanyID);
    res.end(`All ${CompanyName} products inserted`);
});
exports.InsertAllEbsonProducts = InsertAllEbsonProducts;
const DeleteAllEbsonProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, PrismaHelper_1.DeleteAllProductsByCompany)(CompanyID);
    res.end(`All ${CompanyName} products deleted`);
});
exports.DeleteAllEbsonProducts = DeleteAllEbsonProducts;
const DeleteAllEbsonCert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, PrismaHelper_1.DeleteAllCertByCompany)(CompanyID);
    res.end(`All ${CompanyName} product certificates deleted`);
});
exports.DeleteAllEbsonCert = DeleteAllEbsonCert;
const ProcessForDatabase = (products) => __awaiter(void 0, void 0, void 0, function* () {
    // check if any product in the list is in database but not coming in from company api anymore
    (0, ProductHelper_1.deleteOldProducts)(products, CompanyID);
    console.log('products', products);
    //Reset global lists
    updatedProducts = [];
    createdProducts = [];
    productsNotValid = [];
    const allProductPromises = products.map((product) => __awaiter(void 0, void 0, void 0, function* () {
        const productWithProps = { approved: false, certChange: false, create: false, product: null, productState: 1, validDate: null, validatedCertificates: [] };
        const prod = yield (0, PrismaHelper_1.GetUniqueProduct)(product.id);
        var approved = false;
        var created = false;
        var certChange = false;
        if (prod !== null) {
            approved = !!prod.approved ? prod.approved : false;
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
            created = true;
            //var certChange = true;
        }
        productWithProps.approved = approved;
        productWithProps.certChange = certChange;
        productWithProps.create = created;
        productWithProps.product = product;
        const productInfo = yield (0, ProductHelper_1.VerifyProduct)(product, created, certChange);
        productWithProps.productState = productInfo.productState;
        productWithProps.validDate = productInfo.validDate;
        productWithProps.validatedCertificates = productInfo.validatedCertificates;
        if (productInfo.productState === 1) {
            productsNotValid.push(product);
        }
        else if (productInfo.productState === 2) {
            createdProducts.push(product);
        }
        else if (productInfo.productState === 3) {
            updatedProducts.push(product);
        }
        return productWithProps;
    }));
    Promise.all(allProductPromises).then((productsWithProps) => __awaiter(void 0, void 0, void 0, function* () {
        const filteredArray = productsWithProps.filter(prod => prod.productState !== 1);
        yield prisma_1.default.$transaction(filteredArray.map(productWithProps => {
            return prisma_1.default.product.upsert({
                where: {
                    productid: productWithProps.product.id
                },
                update: {
                    approved: productWithProps.approved,
                    title: productWithProps.product.prodName,
                    productid: productWithProps.product.id,
                    sellingcompany: {
                        connect: { id: CompanyID }
                    },
                    categories: {
                        connect: typeof productWithProps.product.fl === 'string' ? { name: productWithProps.product.fl } : productWithProps.product.fl
                    },
                    description: productWithProps.product.longDescription,
                    shortdescription: productWithProps.product.shortDescription,
                    productimageurl: productWithProps.product.prodImage,
                    url: productWithProps.product.url,
                    brand: productWithProps.product.brand,
                    updatedAt: new Date()
                },
                create: {
                    title: productWithProps.product.prodName,
                    productid: productWithProps.product.id,
                    sellingcompany: {
                        connect: { id: CompanyID }
                    },
                    categories: {
                        connect: typeof productWithProps.product.fl === 'string' ? { name: productWithProps.product.fl } : productWithProps.product.fl
                    },
                    description: productWithProps.product.longDescription,
                    shortdescription: productWithProps.product.shortDescription,
                    productimageurl: productWithProps.product.prodImage,
                    url: productWithProps.product.url,
                    brand: productWithProps.product.brand,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        }));
        const allCertificates = filteredArray.map(prod => {
            return prod.validatedCertificates.map(cert => {
                let fileurl = '';
                let validdate = null;
                if (cert.name === 'EPD') {
                    fileurl = prod.product.epdUrl;
                    validdate = prod.validDate[0].date;
                }
                else if (cert.name === 'FSC') {
                    fileurl = prod.product.fscUrl;
                    validdate = prod.validDate[1].date;
                }
                else if (cert.name === 'VOC') {
                    fileurl = prod.product.vocUrl;
                    validdate = prod.validDate[2].date;
                }
                const certItem = {
                    name: cert.name,
                    fileurl: fileurl,
                    validDate: validdate,
                    productId: prod.product.id
                };
                return certItem;
            });
        }).flat();
        yield prisma_1.default.$transaction(allCertificates.map(cert => {
            return prisma_1.default.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: certificateIds_1.certIdFinder[cert.name] }
                    },
                    connectedproduct: {
                        connect: { productid: cert.productId },
                    },
                    fileurl: cert.fileurl,
                    validDate: cert.validDate
                }
            });
        }));
    })).then(() => {
        // write all appropriate files
        (0, ProductHelper_1.WriteAllFiles)(createdProducts, updatedProducts, productsNotValid, CompanyName);
    });
});
