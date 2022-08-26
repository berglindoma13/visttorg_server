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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProductCertificates = void 0;
const prisma_1 = require("../lib/prisma");
// TODO breyta testControllerProduct í meira general product til að geta notað þetta fall fyrir allt
const CreateProductCertificates = (product, validDateCertificates, productValidatedCertificates) => __awaiter(void 0, void 0, void 0, function* () {
    let certificateObjectList = [];
    yield Promise.all(productValidatedCertificates.map((certificate) => __awaiter(void 0, void 0, void 0, function* () {
        if (certificate.name === 'EPD') {
            //TODO -> TÉKKA HVORT CONNECTEDPRODUCT = NULL VIRKI EKKI ÖRUGGLEGA RÉTT
            var date = null;
            if (validDateCertificates[0].message === "Valid") {
                date = validDateCertificates[0].date;
            }
            return yield prisma_1.prismaInstance.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 1 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    },
                    fileurl: product.epdUrl,
                    validDate: date
                }
            }).then((prodcert) => {
                const obj = { id: prodcert.id };
                certificateObjectList.push(obj);
            });
        }
        if (certificate.name === 'FSC') {
            var date = null;
            if (validDateCertificates[1].message === "Valid") {
                date = validDateCertificates[1].date;
            }
            return yield prisma_1.prismaInstance.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 2 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    },
                    fileurl: product.fscUrl,
                    validDate: date
                }
            }).then((prodcert) => {
                const obj = { id: prodcert.id };
                certificateObjectList.push(obj);
            });
        }
        if (certificate.name === 'VOC') {
            var date = null;
            if (validDateCertificates[2].message === "Valid") {
                date = validDateCertificates[2].date;
            }
            return yield prisma_1.prismaInstance.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 3 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    },
                    fileurl: product.vocUrl,
                    validDate: date
                }
            }).then((prodcert) => {
                const obj = { id: prodcert.id };
                certificateObjectList.push(obj);
            });
        }
        if (certificate.name === 'SV') {
            return yield prisma_1.prismaInstance.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 4 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                const obj = { id: prodcert.id };
                certificateObjectList.push(obj);
            });
        }
        if (certificate.name === 'SV_ALLOWED') {
            return yield prisma_1.prismaInstance.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 5 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                const obj = { id: prodcert.id };
                certificateObjectList.push(obj);
            });
        }
        if (certificate.name === 'BREEAM') {
            return yield prisma_1.prismaInstance.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 6 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                const obj = { id: prodcert.id };
                certificateObjectList.push(obj);
            });
        }
        if (certificate.name === 'BLENGILL') {
            return yield prisma_1.prismaInstance.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 7 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                const obj = { id: prodcert.id };
                certificateObjectList.push(obj);
            });
        }
        if (certificate.name === 'EV') {
            return yield prisma_1.prismaInstance.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 8 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                const obj = { id: prodcert.id };
                certificateObjectList.push(obj);
            });
        }
        if (certificate.name === 'CE') {
            return yield prisma_1.prismaInstance.productcertificate.create({
                data: {
                    certificate: {
                        connect: { id: 9 }
                    },
                    connectedproduct: {
                        connect: { productid: product.id },
                    }
                }
            }).then((prodcert) => {
                const obj = { id: prodcert.id };
                certificateObjectList.push(obj);
            });
        }
    }))).then(() => {
    });
    return certificateObjectList;
});
exports.CreateProductCertificates = CreateProductCertificates;
