"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllInvalidSmithNorlandCertificates = exports.DeleteAllSmithNorlandCert = exports.DeleteAllSmithNorlandProducts = exports.GetAllSmithNorlandCategories = exports.InsertAllSmithNorlandProducts = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const PrismaHelper_1 = require("../helpers/PrismaHelper");
const MapCategories_1 = require("../helpers/MapCategories");
const smithnorland_1 = __importDefault(require("../mappers/categories/smithnorland"));
const ProductHelper_1 = require("../helpers/ProductHelper");
const prisma_1 = __importDefault(require("../lib/prisma"));
const certificateIds_1 = require("../mappers/certificates/certificateIds");
const sanity_1 = require("../lib/sanity");
const CertificateValidator_1 = require("../helpers/CertificateValidator");
// SmithNorland COMPANY ID = 4
const SmithNorlandAPI = "https://www.sminor.is/visttorg-products";
const CompanyID = 4;
const CompanyName = 'SmithNorland';
var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];
const convertSmithNorlandProductToDatabaseProduct = async (product) => {
    //map the product category to vistbóks category dictionary
    const prodCategories = product.category.map(cat => {
        return cat;
    });
    const mappedCategories = (0, MapCategories_1.getMappedCategory)(prodCategories, smithnorland_1.default);
    const mappedSubCategories = (0, MapCategories_1.getMappedCategorySub)(prodCategories, smithnorland_1.default);
    console.log('prodCategories', prodCategories);
    console.log('mappedSubCategories', mappedSubCategories);
    const uniqueMappedCategories = mappedCategories.filter((value, index, self) => index === self.findIndex((t) => (t.name === value.name)));
    //Map certificates and validate them before adding to database 
    //TODO WHEN THE FIELD IS ADDED TO THE API
    // const convertedCertificates: Array<string> = product.certificates.map(certificate => { return BykoCertificateMapper[certificate.cert] })
    const convertedProduct = {
        id: product.id !== '' ? `${CompanyID}${product.id}` : product.id,
        prodName: product.title,
        longDescription: product.long_description,
        shortDescription: product.short_description,
        fl: uniqueMappedCategories,
        subFl: mappedSubCategories,
        prodImage: product.images[0],
        url: product.url,
        brand: product.brand,
        fscUrl: "",
        epdUrl: "",
        vocUrl: "",
        ceUrl: "",
        //TODO - FIX CERTIFICATES IF THEY ADD MORE TYPES OF PRODUCTS
        certificates: [
            product.vottun === 'orka' && product.vottunarskjol[0] !== '' ? { name: "ENERGY" } : null,
        ].filter(cert => cert !== null)
    };
    return convertedProduct;
};
const InsertAllSmithNorlandProducts = async (req, res) => {
    const SmithNorlandData = await requestSmithNorlandApi();
    //Check if it comes back undefined, then there was an error retreiving the data
    if (!!SmithNorlandData) {
        //process all data and insert into database - first convert to databaseProduct Array
        const allConvertedSmithNorlandProducts = [];
        for (var i = 0; i < SmithNorlandData.products.length; i++) {
            const convertedProduct = await convertSmithNorlandProductToDatabaseProduct(SmithNorlandData.products[i]);
            //here is a single product
            allConvertedSmithNorlandProducts.push(convertedProduct);
        }
        await ProcessForDatabase(allConvertedSmithNorlandProducts);
        return res.end("Successful import");
    }
    else {
        return res.end("SmithNorland response was invalid");
    }
};
exports.InsertAllSmithNorlandProducts = InsertAllSmithNorlandProducts;
const GetAllSmithNorlandCategories = async (req, res) => {
    const Data = await requestSmithNorlandApi();
    if (!!Data) {
        await ListCategories(Data);
        //TODO return categories
        res.end("Successfully listed categories and imported into file");
    }
    else {
        res.end("Failed to list categories");
    }
};
exports.GetAllSmithNorlandCategories = GetAllSmithNorlandCategories;
const DeleteAllSmithNorlandProducts = async (req, res) => {
    // delete all products with company id 3
    (0, PrismaHelper_1.DeleteAllProductsByCompany)(CompanyID);
    res.end("All SmithNorland products deleted");
};
exports.DeleteAllSmithNorlandProducts = DeleteAllSmithNorlandProducts;
const DeleteAllSmithNorlandCert = async (req, res) => {
    // delete all product certificates connected to company id 3
    (0, PrismaHelper_1.DeleteAllCertByCompany)(CompanyID);
    res.end("all product certificates deleted for SmithNorland");
};
exports.DeleteAllSmithNorlandCert = DeleteAllSmithNorlandCert;
const requestSmithNorlandApi = async () => {
    return axios_1.default.get(SmithNorlandAPI).then(response => {
        if (response.status === 200) {
            const data = response;
            return data.data;
        }
        else {
            console.log(`Error occured : ${response.status} - ${response.statusText}`);
        }
    });
};
const ListCategories = async (data) => {
    const prodtypelist = data.products.map(product => {
        return product.category.map(cat => {
            return cat;
        });
    }).flat();
    const uniqueArrayProdType = prodtypelist.filter(function (item, pos) {
        return prodtypelist.indexOf(item) == pos;
    });
    fs_1.default.writeFile('writefiles/SmithNorlandCategories.txt', uniqueArrayProdType.toString(), function (err) {
        if (err) {
            return console.error(err);
        }
    });
};
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
    return Promise.all(allProductPromises).then(async (productsWithProps) => {
        const filteredArray = productsWithProps.filter(prod => prod.productState !== 1);
        await prisma_1.default.$transaction(filteredArray.map(productWithProps => {
            const systemArray = (0, CertificateValidator_1.mapToCertificateSystem)(productWithProps.product);
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
                    subCategories: {
                        connect: productWithProps.product.subFl
                    },
                    certificateSystems: {
                        connect: systemArray
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
                    subCategories: {
                        connect: productWithProps.product.subFl
                    },
                    certificateSystems: {
                        connect: systemArray
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
        (0, ProductHelper_1.WriteAllFiles)(createdProducts, updatedProducts, productsNotValid, 'SmithNorland');
    });
};
const GetAllInvalidSmithNorlandCertificates = async (req, res) => {
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
exports.GetAllInvalidSmithNorlandCertificates = GetAllInvalidSmithNorlandCertificates;
