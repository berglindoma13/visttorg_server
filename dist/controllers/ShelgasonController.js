"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllInvalidSHelgasonCertificates = exports.DeleteAllSHelgasonCert = exports.DeleteAllSHelgasonProducts = exports.InsertAllSHelgasonProducts = void 0;
const PrismaHelper_1 = require("../helpers/PrismaHelper");
const ProductHelper_1 = require("../helpers/ProductHelper");
const prisma_1 = __importDefault(require("../lib/prisma"));
const certificateIds_1 = require("../mappers/certificates/certificateIds");
const sanity_1 = require("../lib/sanity");
const CertificateValidator_1 = require("../helpers/CertificateValidator");
const CompanyID = 5;
const SheetID = '1fMgOGGoI20sqTiapQNC-89F9UrrqnvselMnw-OXlgX8';
const CompanyName = 'S.Helgason';
var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];
const InsertAllSHelgasonProducts = async (req, res) => {
    // get all data from sheets file
    (0, ProductHelper_1.getAllProductsFromGoogleSheets)(SheetID, ProcessForDatabase, CompanyID);
    res.end(`All ${CompanyName} products inserted`);
};
exports.InsertAllSHelgasonProducts = InsertAllSHelgasonProducts;
const DeleteAllSHelgasonProducts = async (req, res) => {
    (0, PrismaHelper_1.DeleteAllProductsByCompany)(CompanyID);
    res.end(`All ${CompanyName} products deleted`);
};
exports.DeleteAllSHelgasonProducts = DeleteAllSHelgasonProducts;
const DeleteAllSHelgasonCert = async (req, res) => {
    (0, PrismaHelper_1.DeleteAllCertByCompany)(CompanyID);
    res.end(`All ${CompanyName} product certificates deleted`);
};
exports.DeleteAllSHelgasonCert = DeleteAllSHelgasonCert;
const ProcessForDatabase = async (products) => {
    // check if any product in the list is in database but not coming in from company api anymore
    (0, ProductHelper_1.deleteOldProducts)(products, CompanyID);
    //Reset global lists
    updatedProducts = [];
    createdProducts = [];
    productsNotValid = [];
    const allProductPromises = products.map(async (product) => {
        const productWithProps = { approved: false, certChange: false, create: false, product: null, productState: 1, validDate: null, validatedCertificates: [] };
        const prod = await (0, PrismaHelper_1.GetUniqueProduct)(product.productid, CompanyID);
        var approved = false;
        var created = false;
        var certChange = false;
        if (prod !== null) {
            approved = !!prod.approved ? prod.approved : false;
            const now = new Date();
            prod.certificates.map((cert) => {
                if (cert.certificateid == 1) {
                    // epd file url is not the same
                    if (cert.fileurl !== product.epdUrl || (cert.validDate !== null && cert.validDate <= now)) {
                        certChange = true;
                        approved = false;
                    }
                }
                if (cert.certificateid == 2) {
                    // fsc file url is not the same
                    if (cert.fileurl !== product.fscUrl || (cert.validDate !== null && cert.validDate <= now)) {
                        certChange = true;
                        approved = false;
                    }
                }
                if (cert.certificateid == 3) {
                    // voc file url is not the same
                    if (cert.fileurl !== product.vocUrl || (cert.validDate !== null && cert.validDate <= now)) {
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
        console.log('prod', productWithProps);
        return productWithProps;
    });
    Promise.all(allProductPromises).then(async (productsWithProps) => {
        const filteredArray = productsWithProps.filter(prod => prod.productState !== 1);
        await prisma_1.default.$transaction(filteredArray.map(productWithProps => {
            const systemArray = (0, CertificateValidator_1.mapToCertificateSystem)(productWithProps.product);
            return prisma_1.default.product.upsert({
                where: {
                    productIdentifier: { productid: productWithProps.product.productid, companyid: CompanyID }
                },
                update: {
                    approved: productWithProps.approved,
                    title: productWithProps.product.title,
                    productid: productWithProps.product.productid,
                    sellingcompany: {
                        connect: { id: CompanyID }
                    },
                    categories: {
                        connect: typeof productWithProps.product.categories === 'string' ? { name: productWithProps.product.categories } : productWithProps.product.categories
                    },
                    subCategories: {
                        connect: productWithProps.product.subCategories
                    },
                    certificateSystems: {
                        connect: systemArray
                    },
                    description: productWithProps.product.description,
                    shortdescription: productWithProps.product.shortdescription,
                    productimageurl: productWithProps.product.productimageurl,
                    url: productWithProps.product.url,
                    brand: productWithProps.product.brand,
                    updatedAt: new Date()
                },
                create: {
                    title: productWithProps.product.title,
                    productid: productWithProps.product.productid,
                    sellingcompany: {
                        connect: { id: CompanyID }
                    },
                    categories: {
                        connect: typeof productWithProps.product.categories === 'string' ? { name: productWithProps.product.categories } : productWithProps.product.categories
                    },
                    subCategories: {
                        connect: productWithProps.product.subCategories
                    },
                    certificateSystems: {
                        connect: systemArray
                    },
                    description: productWithProps.product.description,
                    shortdescription: productWithProps.product.shortdescription,
                    productimageurl: productWithProps.product.productimageurl,
                    url: productWithProps.product.url,
                    brand: productWithProps.product.brand,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        }));
        const deletedProductsCerts = await (0, PrismaHelper_1.DeleteAllCertByCompany)(CompanyID);
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
                    productId: prod.product.productid
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
const GetAllInvalidSHelgasonCertificates = async (req, res) => {
    const allCerts = await (0, PrismaHelper_1.GetAllInvalidProductCertsByCompany)(CompanyID);
    const SanityCertArray = allCerts.map(cert => {
        return {
            _id: `${CompanyName}Cert${cert.id}`,
            _type: "Certificate",
            productid: `${cert.productid}`,
            certfileurl: `${cert.fileurl}`,
            checked: false
        };
    });
    const sanityCertReferences = [];
    const SanityPromises = SanityCertArray.map(sanityCert => {
        return sanity_1.client.createIfNotExists(sanityCert).then(createdCert => {
            sanityCertReferences.push({ "_type": "reference", "_ref": createdCert._id });
        }).catch(error => {
            console.log('error', error);
        });
    });
    Promise.all(SanityPromises).then(() => {
        //SANITY.IO CREATE CERTIFICATELIST IF IT DOES NOT EXIST
        const doc = {
            _id: `${CompanyName}CertList`,
            _type: "CertificateList",
            CompanyName: CompanyName,
        };
        sanity_1.client
            .transaction()
            .createIfNotExists(doc)
            .patch(`${CompanyName}CertList`, (p) => p.setIfMissing({ Certificates: [] })
            // Add the items after the last item in the array (append)
            .insert('replace', 'Certificates[-1]', sanityCertReferences))
            .commit({ autoGenerateArrayKeys: true })
            .then((updatedCert) => {
            console.log('Hurray, the cert is updated! New document:');
            console.log(updatedCert);
        })
            .catch((err) => {
            console.error('Oh no, the update failed: ', err.message);
        });
    });
    res.end("Successfully logged all invalid certs");
};
exports.GetAllInvalidSHelgasonCertificates = GetAllInvalidSHelgasonCertificates;
