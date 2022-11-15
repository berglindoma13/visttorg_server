"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllInvalidBykoCertificates = exports.DeleteAllProducts = exports.GetAllCategories = exports.InsertAllBykoProducts = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const byko_1 = __importDefault(require("../mappers/categories/byko"));
const byko_2 = __importDefault(require("../mappers/certificates/byko"));
const PrismaHelper_1 = require("../helpers/PrismaHelper");
const ProductHelper_1 = require("../helpers/ProductHelper");
const prisma_1 = __importDefault(require("../lib/prisma"));
const certificateIds_1 = require("../mappers/certificates/certificateIds");
const MapCategories_1 = require("../helpers/MapCategories");
const sanity_1 = require("../lib/sanity");
const CertificateValidator_1 = require("../helpers/CertificateValidator");
// BYKO COMPANY ID = 1
const BykoAPI = "https://byko.is/umhverfisvottadar?password=cert4env";
const CompanyID = 1;
const CompanyName = 'BYKO';
var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];
const convertBykoProductToDatabaseProduct = async (product) => {
    //map the product category to vistbóks category dictionary
    // TODO - FIX TO USE THE GENERIC MAPPING FUNCTION - SIMPLIFY
    const mappedCategory = [];
    const prodTypeParentCategories = (0, MapCategories_1.getMappedCategory)(product.prodTypeParent.split(';'), byko_1.default);
    const prodTypeCategories = (0, MapCategories_1.getMappedCategory)(product.prodType.split(';'), byko_1.default);
    prodTypeCategories.map(cat => mappedCategory.push(cat));
    prodTypeParentCategories.map(cat => mappedCategory.push(cat));
    const mappedSubCategory = [];
    const prodTypeParentSubCategories = (0, MapCategories_1.getMappedCategorySub)(product.prodTypeParent.split(';'), byko_1.default);
    const prodTypeSubCategories = (0, MapCategories_1.getMappedCategorySub)(product.prodType.split(';'), byko_1.default);
    prodTypeParentSubCategories.map(cat => mappedSubCategory.push(cat));
    prodTypeSubCategories.map(cat => mappedSubCategory.push(cat));
    //Map certificates and validate them before adding to database
    const convertedCertificates = product.certificates.map(certificate => { return byko_2.default[certificate.cert]; });
    const convertedProduct = {
        productid: product.axId !== '' ? `${CompanyID}${product.axId}` : product.axId,
        title: product.prodName,
        description: product.longDescription,
        shortdescription: product.shortDescription,
        categories: mappedCategory,
        subCategories: mappedSubCategory,
        productimageurl: `https://byko.is${product.prodImage}`,
        url: product.url,
        brand: product.brand,
        fscUrl: product.fscUrl,
        epdUrl: product.epdUrl,
        vocUrl: product.vocUrl,
        //fix this when byko adds CE files to the API
        ceUrl: '',
        certificates: [
            product.fscUrl !== '' ? { name: "FSC" } : null,
            product.epdUrl !== '' ? { name: "EPD" } : null,
            product.vocUrl !== '' ? { name: "VOC" } : null,
            convertedCertificates.includes('SV_ALLOWED') ? { name: "SV_ALLOWED" } : null,
            convertedCertificates.includes('SV') ? { name: "SV" } : null,
            convertedCertificates.includes('BLENGILL') ? { name: "BLENGILL" } : null,
            convertedCertificates.includes('EV') ? { name: "EV" } : null,
            // results[i].ce  === 'TRUE' ? { name: "CE" } : null
        ].filter(cert => cert !== null)
    };
    return convertedProduct;
};
const InsertAllBykoProducts = async (req, res) => {
    const bykoData = await requestBykoApi(1);
    //Check if it comes back undefined, then there was an error retreiving the data
    if (!!bykoData) {
        //process all data and insert into database - first convert to databaseProduct Array
        const allConvertedBykoProducts = [];
        for (var i = 0; i < bykoData.productList.length; i++) {
            const convertedProduct = await convertBykoProductToDatabaseProduct(bykoData.productList[i]);
            //here is a single product
            allConvertedBykoProducts.push(convertedProduct);
        }
        await ProcessForDatabase(allConvertedBykoProducts);
        return res.end("Successful import");
    }
    else {
        return res.end("Byko response was invalid");
    }
};
exports.InsertAllBykoProducts = InsertAllBykoProducts;
const GetAllCategories = async (req, res) => {
    const bykoData = await requestBykoApi(1);
    if (!!bykoData) {
        await ListCategories(bykoData);
        //TODO return categories
        res.end("Successfully listed categories and imported into file");
    }
    else {
        res.end("Failed to list categories");
    }
};
exports.GetAllCategories = GetAllCategories;
const DeleteAllProducts = async (req, res) => {
    await (0, PrismaHelper_1.DeleteAllCertByCompany)(1);
    await (0, PrismaHelper_1.DeleteAllProductsByCompany)(1);
    res.end("All deleted");
};
exports.DeleteAllProducts = DeleteAllProducts;
const requestBykoApi = async (pageNr) => {
    return axios_1.default.get(`${BykoAPI}&PageNum=${pageNr}`).then(response => {
        if (response.status === 200) {
            const data = response.data;
            return data;
        }
        else {
            console.error(`Error occured : ${response.status} - ${response.statusText}`);
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
        return productWithProps;
    });
    return Promise.all(allProductPromises).then(async (productsWithProps) => {
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
const ListCategories = async (data) => {
    const filteredProdType = data.productList.filter(product => product.prodTypeParent != 'Fatnaður');
    const prodtypelist = filteredProdType.map(product => product.prodType);
    const parentprodtypelist = filteredProdType.map(product => product.prodTypeParent);
    const combined = prodtypelist.concat(parentprodtypelist);
    const uniqueArrayProdType = combined.filter(function (item, pos) {
        return combined.indexOf(item) == pos;
    });
    const combinedWithReplace = uniqueArrayProdType.toString().replaceAll(';', ',');
    fs_1.default.writeFile('writefiles/BykoCategories.txt', combinedWithReplace, function (err) {
        if (err) {
            return console.error(err);
        }
    });
};
const GetAllInvalidBykoCertificates = async (req, res) => {
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
exports.GetAllInvalidBykoCertificates = GetAllInvalidBykoCertificates;
