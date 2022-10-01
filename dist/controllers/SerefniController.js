"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllInvalidSerefniCertificates = exports.DeleteAllSerefniCert = exports.DeleteAllSerefniProducts = exports.InsertAllSerefniProducts = void 0;
const PrismaHelper_1 = require("../helpers/PrismaHelper");
const fs_1 = __importDefault(require("fs"));
const ProductHelper_1 = require("../helpers/ProductHelper");
const prisma_1 = __importDefault(require("../lib/prisma"));
const certificateIds_1 = require("../mappers/certificates/certificateIds");
const CompanyID = 6;
const SheetID = '1PIP46MtGWgf-qdxbTyMo8FSd1A_sIljIaoqlI8rjzW4';
const CompanyName = 'Sérefni';
var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];
const InsertAllSerefniProducts = async (req, res) => {
    // get all data from sheets file
    (0, ProductHelper_1.getAllProductsFromGoogleSheets)(SheetID, ProcessForDatabase, CompanyID);
    res.end(`All ${CompanyName} products inserted`);
};
exports.InsertAllSerefniProducts = InsertAllSerefniProducts;
const DeleteAllSerefniProducts = async (req, res) => {
    (0, PrismaHelper_1.DeleteAllProductsByCompany)(CompanyID);
    res.end(`All ${CompanyName} products deleted`);
};
exports.DeleteAllSerefniProducts = DeleteAllSerefniProducts;
const DeleteAllSerefniCert = async (req, res) => {
    (0, PrismaHelper_1.DeleteAllCertByCompany)(CompanyID);
    res.end(`All ${CompanyName} product certificates deleted`);
};
exports.DeleteAllSerefniCert = DeleteAllSerefniCert;
const ProcessForDatabase = async (products) => {
    // check if any product in the list is in database but not coming in from company api anymore
    (0, ProductHelper_1.deleteOldProducts)(products, CompanyID);
    //Reset global lists
    updatedProducts = [];
    createdProducts = [];
    productsNotValid = [];
    const allProductPromises = products.map(async (product) => {
        const productWithProps = { approved: false, certChange: false, create: false, product: null, productState: 1, validDate: null, validatedCertificates: [] };
        const prod = await (0, PrismaHelper_1.GetUniqueProduct)(product.id, CompanyID);
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
        const productInfo = await (0, ProductHelper_1.VerifyProduct)(product, created, certChange);
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
    });
    Promise.all(allProductPromises).then(async (productsWithProps) => {
        const filteredArray = productsWithProps.filter(prod => prod.productState !== 1);
        await prisma_1.default.$transaction(filteredArray.map(productWithProps => {
            return prisma_1.default.product.upsert({
                where: {
                    productIdentifier: { productid: productWithProps.product.id, companyid: CompanyID }
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
        await (0, PrismaHelper_1.DeleteAllCertByCompany)(CompanyID);
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
        await prisma_1.default.$transaction(allCertificates.map(cert => {
            return prisma_1.default.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: certificateIds_1.certIdFinder[cert.name] }
                    },
                    connectedproduct: {
                        connect: {
                            productIdentifier: { productid: cert.productId, companyid: CompanyID }
                        },
                    },
                    fileurl: cert.fileurl,
                    validDate: cert.validDate
                }
            });
        }));
    }).then(() => {
        // write all appropriate files
        (0, ProductHelper_1.WriteAllFiles)(createdProducts, updatedProducts, productsNotValid, CompanyName);
    });
};
const GetAllInvalidSerefniCertificates = async (req, res) => {
    const allCerts = await (0, PrismaHelper_1.GetAllInvalidProductCertsByCompany)(CompanyID);
    const mapped = allCerts.map(cert => {
        return {
            productid: cert.productid,
            certfileurl: cert.fileurl,
            validDate: cert.validDate
        };
    });
    fs_1.default.writeFile('writefiles/SerefniInvalidcerts.json', JSON.stringify(mapped), function (err) {
        if (err) {
            return console.error(err);
        }
    });
    res.end("Successfully logged all invalid certs");
};
exports.GetAllInvalidSerefniCertificates = GetAllInvalidSerefniCertificates;
