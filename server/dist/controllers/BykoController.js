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
exports.DeleteAllProducCertificates = exports.DeleteAllCategories = exports.DeleteAllProducts = exports.GetAllCategories = exports.TestProduct = exports.InsertAllBykoProducts = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const byko_1 = __importDefault(require("../mappers/categories/byko"));
const CertificateValidator_1 = require("../helpers/CertificateValidator");
const byko_2 = __importDefault(require("../mappers/certificates/byko"));
// BYKO COMPANY ID = 1
const prisma = new client_1.PrismaClient();
const BykoAPI = "https://byko.is/umhverfisvottadar?password=cert4env";
const mockProduct = {
    id: '12345',
    axId: '',
    retailer: 'BYKO',
    brand: 'Önnur vörumerki',
    prodName: 'Burðarviður 45x95 mm',
    shortDescription: 'Heflað timbur',
    longDescription: 'Burðarviður styrkflokkur C24.',
    metaTitle: 'Styrkleiksflokkað timbur',
    metaKeywords: '',
    prodTypeParent: 'Timbur',
    prodType: 'Burðarviður',
    groupId: 235017,
    groupName: 'Timbur',
    url: 'https://byko.is/leit/vara?ProductID=200907',
    prodImage: '/Admin/Public/GetImage.ashx?width=400&height=400&crop=5&Compression=75&DoNotUpscale=true&image=/Files/Images/Products/200907___0_fullsize.jpg',
    fscUrl: 'https://byko.is/Files/Files/PDF%20skjol/BREEAM/FSC_certificate_valid_to_31.05.2024.pdf',
    epdUrl: '',
    vocUrl: '',
    certificates: [
        { cert: 'FSC' },
        { cert: 'Leyfilegt í svansvottað hús' },
        { cert: 'BREEAM' }
    ]
};
const InsertAllBykoProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bykoData = yield requestBykoApi(1);
    //Check if it comes back undefined, then there was an error retreiving the data
    if (!!bykoData) {
        //delete all productcertificates so they wont be duplicated and so they are up to date
        yield prisma.productcertificate.deleteMany({
            where: {
                connectedproduct: {
                    companyid: 1
                }
            }
        });
        //process all data and insert into database
        yield ProcessForDatabase(bykoData);
        //if the json from byko has multiple pages, make sure to call all the pages to get all the products
        if (bykoData.totalPageCount > 1) {
            for (var i = 0; i < bykoData.totalPageCount; i++) {
                const moreData = yield requestBykoApi(i + 2);
                if (!!moreData) {
                    yield ProcessForDatabase(moreData);
                }
            }
        }
        return res.end("Successful import");
    }
    else {
        return res.end("Byko response was invalid");
    }
});
exports.InsertAllBykoProducts = InsertAllBykoProducts;
const TestProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // await UpsertProductInDatabase(mockProduct)
    const products = yield prisma.product.findMany({
        where: { productid: "12345" },
        include: {
            sellingcompany: true,
            categories: true,
            certificates: {
                include: {
                    certificate: true
                }
            }
        },
    });
    const certs = yield prisma.productcertificate.findFirst({
        where: {
            productid: "12345"
        }
    });
    const allProducts = yield prisma.product.findMany({
        where: { productid: mockProduct.id },
        include: {
            sellingcompany: true,
            categories: true,
            certificates: {
                include: {
                    certificate: true
                }
            }
        },
    });
    return res.end('WHOOP');
});
exports.TestProduct = TestProduct;
const GetAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bykoData = yield requestBykoApi(1);
    if (!!bykoData) {
        yield ListCategories(bykoData);
        //TODO return categories
        res.end("Successfully listed categories and imported into file");
    }
    else {
        res.end("Failed to list categories");
    }
});
exports.GetAllCategories = GetAllCategories;
const DeleteAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.product.deleteMany({
        where: {
            companyid: 1
        }
    });
    res.end("All deleted");
});
exports.DeleteAllProducts = DeleteAllProducts;
const DeleteAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.category.deleteMany({});
    //TOOD - only delete byko categories
    res.end("All deleted");
});
exports.DeleteAllCategories = DeleteAllCategories;
const DeleteAllProducCertificates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.productcertificate.deleteMany({
        where: {
            connectedproduct: {
                companyid: 1
            }
        }
    });
    res.end("All Byko product certificates deleted");
});
exports.DeleteAllProducCertificates = DeleteAllProducCertificates;
const requestBykoApi = (pageNr) => __awaiter(void 0, void 0, void 0, function* () {
    return axios_1.default.get(`${BykoAPI}&PageNum=${pageNr}`).then(response => {
        if (response.status === 200) {
            const data = response.data;
            return data;
        }
        else {
            console.error(`Error occured : ${response.status} - ${response.statusText}`);
        }
    });
});
const ProcessForDatabase = (data) => __awaiter(void 0, void 0, void 0, function* () {
    for (var i = 0; i < data.productList.length; i++) {
        //here is a single product
        yield UpsertProductInDatabase(data.productList[i]);
    }
    // for(var i = 0; i < 100; i++){
    //   await UpsertProductInDatabase(data[i])
    // }
});
//PRODUCT CERTIFICATE ID'S
// EPD = 1
// FSC = 2
// VOC = 3
// SV = 4
// SV_ALLOWED = 5
// BREEAM = 6
// BLENGILL = 7
const CreateProductCertificates = (product, productValidatedCertificates) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all(productValidatedCertificates.map((certificate) => __awaiter(void 0, void 0, void 0, function* () {
        if (certificate.name === 'EPD') {
            //TODO -> TÉKKA HVORT CONNECTEDPRODUCT = NULL VIRKI EKKI ÖRUGGLEGA RÉTT
            return yield prisma.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 1 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    },
                    fileurl: product.epdUrl
                }
            }).then((prodcert) => {
                // const obj = { id : prodcert.id }
                // certificateObjectList.push(obj)
            });
        }
        if (certificate.name === 'FSC') {
            return yield prisma.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 2 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    },
                    fileurl: product.fscUrl
                }
            }).then((prodcert) => {
                // const obj = { id : prodcert.id }
                // certificateObjectList.push(obj)
            });
        }
        if (certificate.name === 'VOC') {
            return yield prisma.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 3 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    },
                    fileurl: product.vocUrl
                }
            }).then((prodcert) => {
                // const obj = { id : prodcert.id }
                // certificateObjectList.push(obj)
            });
        }
        if (certificate.name === 'SV') {
            return yield prisma.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 4 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                // const obj = { id : prodcert.id }
                // certificateObjectList.push(obj)
            });
        }
        if (certificate.name === 'SV_ALLOWED') {
            return yield prisma.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 5 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                // const obj = { id : prodcert.id }
                // certificateObjectList.push(obj)
            });
        }
        if (certificate.name === 'BREEAM') {
            return yield prisma.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 6 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                // const obj = { id : prodcert.id }
                // certificateObjectList.push(obj)
            });
        }
        if (certificate.name === 'BLENGILL') {
            return yield prisma.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 7 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                // const obj = { id : prodcert.id }
                // certificateObjectList.push(obj)
            });
        }
    }))).then(() => {
    });
});
const ListCategories = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const filteredProdType = data.productList.filter(product => product.prodTypeParent != 'Fatnaður');
    const prodtypelist = filteredProdType.map(product => product.prodType);
    //Ferðavörur,Útileguvörur,Fatnaður
    const parentprodtypelist = filteredProdType.map(product => product.prodTypeParent);
    const uniqueArrayProdType = prodtypelist.filter(function (item, pos) {
        return prodtypelist.indexOf(item) == pos;
    });
    const uniqueArrayParentProdType = parentprodtypelist.filter(function (item, pos) {
        return parentprodtypelist.indexOf(item) == pos;
    });
    fs_1.default.writeFile('prodtypes.txt', uniqueArrayProdType.toString(), function (err) {
        if (err) {
            return console.error(err);
        }
    });
    fs_1.default.writeFile('parentprodtypes.txt', uniqueArrayParentProdType.toString(), function (err) {
        if (err) {
            return console.error(err);
        }
    });
});
const getMappedCategory = (category) => {
    const matchedCategory = [];
    const categoryList = category.split(';');
    return new Promise((resolve, reject) => {
        for (const cat in byko_1.default) {
            for (const productCategory in categoryList) {
                //@ts-ignore
                if (byko_1.default[cat].includes(categoryList[productCategory])) {
                    matchedCategory.push({ name: cat });
                }
            }
        }
        resolve(matchedCategory);
    });
};
const UpsertProductInDatabase = (product) => __awaiter(void 0, void 0, void 0, function* () {
    //Map certificates and validate them before adding to database
    const convertedCertificates = product.certificates.map(certificate => {
        return {
            //@ts-ignore
            name: byko_2.default[certificate.cert]
        };
    });
    const validatedCertificates = (0, CertificateValidator_1.CertificateValidator)({ certificates: convertedCertificates, fscUrl: product.fscUrl, epdUrl: product.epdUrl, vocUrl: product.vocUrl });
    //If there are not valid certificates on the product, then it should not be in the database
    if (validatedCertificates.length === 0) {
        return;
    }
    //map the product category to vistbóks category dictionary
    const mappedCategory = [];
    const prodTypeParentCategories = yield getMappedCategory(product.prodTypeParent);
    const prodTypeCategories = yield getMappedCategory(product.prodType);
    prodTypeCategories.map(cat => mappedCategory.push(cat));
    prodTypeParentCategories.map(cat => mappedCategory.push(cat));
    //Product needs to fit into at least one of our allowed categories
    if (mappedCategory.length > 0) {
        //add or edit the product in the database
        yield prisma.product.upsert({
            where: {
                productid: product.id
            },
            update: {
                // approved = false
                title: product.prodName,
                productid: product.id,
                sellingcompany: {
                    connect: { id: 1 }
                },
                categories: {
                    connect: mappedCategory
                },
                description: product.longDescription,
                shortdescription: product.shortDescription,
                productimageurl: `https://byko.is/${product.prodImage}`,
                url: product.url,
                brand: product.brand,
                updatedAt: new Date(),
            },
            create: {
                title: product.prodName,
                productid: product.id,
                sellingcompany: {
                    connect: { id: 1 }
                },
                categories: {
                    connect: mappedCategory
                },
                description: product.longDescription,
                shortdescription: product.shortDescription,
                productimageurl: `https://byko.is/${product.prodImage}`,
                url: product.url,
                brand: product.brand,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        //create the product certificates for this specific product
        yield CreateProductCertificates(product, validatedCertificates);
    }
});
