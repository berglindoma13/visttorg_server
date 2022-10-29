"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllInvalidTengiCertificates = exports.DeleteAllTengiCert = exports.DeleteAllTengiProducts = exports.GetAllTengiCategories = exports.InsertAllTengiProducts = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const PrismaHelper_1 = require("../helpers/PrismaHelper");
const MapCategories_1 = require("../helpers/MapCategories");
const tengi_1 = __importDefault(require("../mappers/categories/tengi"));
const ProductHelper_1 = require("../helpers/ProductHelper");
const prisma_1 = __importDefault(require("../lib/prisma"));
const certificateIds_1 = require("../mappers/certificates/certificateIds");
const sanity_1 = require("../lib/sanity");
const CertificateValidator_1 = require("../helpers/CertificateValidator");
// TENGI COMPANY ID = 3
const TengiAPI = "https://api.integrator.is/Products/GetMany/?CompanyId=608c19f3591c2b328096b230&ApiKey=b3a6e86d4d4d6612b55d436f7fa60c65d0f8f217c34ead6333407162d308982b&Status=2&Brands=61efc9d1591c275358c86f84";
const CompanyID = 3;
const CompanyName = 'Tengi';
var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];
const convertTengiProductToDatabaseProduct = async (product) => {
    //map the product category to vistbóks category dictionary
    const prodCategories = product.StandardFields.Categories.map(cat => {
        return cat.Name;
    });
    const mappedCategories = (0, MapCategories_1.getMappedCategory)(prodCategories, tengi_1.default);
    const mappedSubCategories = (0, MapCategories_1.getMappedCategorySub)(prodCategories, tengi_1.default);
    //Map certificates and validate them before adding to database 
    //TODO WHEN THE FIELD IS ADDED TO THE API
    // const convertedCertificates: Array<string> = product.certificates.map(certificate => { return BykoCertificateMapper[certificate.cert] })
    const convertedProduct = {
        id: product.StandardFields.SKU !== '' ? `${CompanyID}${product.StandardFields.SKU}` : product.StandardFields.SKU,
        prodName: product.StandardFields.Name,
        longDescription: product.StandardFields.Description,
        shortDescription: product.StandardFields.ShortDescription,
        fl: mappedCategories,
        subFl: mappedSubCategories,
        prodImage: product.Images[0].Url,
        url: product.CustomFields.ProductUrl,
        brand: product.StandardFields.Brands[0].Name,
        fscUrl: "",
        epdUrl: "",
        vocUrl: "",
        ceUrl: "",
        //TODO - FIX CERTIFICATES WHEN THEY ARE PUT IN THE API FROM TENGI, AUTOMATICALLY ACCEPTING NOW
        certificates: [
            { name: "SV_ALLOWED" },
        ].filter(cert => cert !== null)
    };
    // console.log('convertedProduct', convertedProduct)
    return convertedProduct;
};
const InsertAllTengiProducts = async (req, res) => {
    const tengiData = await requestTengiApi();
    //Check if it comes back undefined, then there was an error retreiving the data
    if (!!tengiData) {
        //process all data and insert into database - first convert to databaseProduct Array
        const allConvertedTengiProducts = [];
        for (var i = 0; i < tengiData.Data.length; i++) {
            const convertedProduct = await convertTengiProductToDatabaseProduct(tengiData.Data[i]);
            //here is a single product
            allConvertedTengiProducts.push(convertedProduct);
        }
        await ProcessForDatabase(allConvertedTengiProducts);
        return res.end("Successful import");
    }
    else {
        return res.end("Tengi response was invalid");
    }
};
exports.InsertAllTengiProducts = InsertAllTengiProducts;
const GetAllTengiCategories = async (req, res) => {
    const Data = await requestTengiApi();
    if (!!Data) {
        await ListCategories(Data);
        //TODO return categories
        res.end("Successfully listed categories and imported into file");
    }
    else {
        res.end("Failed to list categories");
    }
};
exports.GetAllTengiCategories = GetAllTengiCategories;
const DeleteAllTengiProducts = async (req, res) => {
    // delete all products with company id 3
    (0, PrismaHelper_1.DeleteAllProductsByCompany)(CompanyID);
    res.end("All Tengi products deleted");
};
exports.DeleteAllTengiProducts = DeleteAllTengiProducts;
const DeleteAllTengiCert = async (req, res) => {
    // delete all product certificates connected to company id 3
    (0, PrismaHelper_1.DeleteAllCertByCompany)(CompanyID);
    res.end("all product certificates deleted for Tengi");
};
exports.DeleteAllTengiCert = DeleteAllTengiCert;
const requestTengiApi = async () => {
    return axios_1.default.get(TengiAPI).then(response => {
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
    const prodtypelist = data.Data.map(product => {
        return product.StandardFields.Categories.map(cat => {
            return cat.Name;
        });
    }).flat();
    const uniqueArrayProdType = prodtypelist.filter(function (item, pos) {
        return prodtypelist.indexOf(item) == pos;
    });
    fs_1.default.writeFile('writefiles/TengiCategories.txt', uniqueArrayProdType.toString(), function (err) {
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
        (0, ProductHelper_1.WriteAllFiles)(createdProducts, updatedProducts, productsNotValid, 'Tengi');
    });
};
const GetAllInvalidTengiCertificates = async (req, res) => {
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
exports.GetAllInvalidTengiCertificates = GetAllInvalidTengiCertificates;
