"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProductCertificates = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const CreateProductCertificates = (product, validDate, productValidatedCertificate) => {
    if (productValidatedCertificate.name === 'EPD') {
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 1 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                },
                fileurl: product.epdUrl,
                validDate: validDate[0].date
            }
        });
    }
    else if (productValidatedCertificate.name === 'FSC') {
        var date = null;
        if (validDate[1].message === "Valid") {
            date = validDate[1].date;
        }
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 2 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                },
                fileurl: product.fscUrl,
                validDate: validDate[1].date
            }
        });
    }
    else if (productValidatedCertificate.name === 'VOC') {
        var date = null;
        if (validDate[2].message === "Valid") {
            date = validDate[2].date;
        }
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 3 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                },
                fileurl: product.vocUrl,
                validDate: validDate[2].date
            }
        });
    }
    else if (productValidatedCertificate.name === 'SV') {
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 4 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                }
            }
        });
    }
    if (productValidatedCertificate.name === 'SV_ALLOWED') {
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 5 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                }
            }
        });
    }
    else if (productValidatedCertificate.name === 'BREEAM') {
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 6 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                }
            }
        });
    }
    else if (productValidatedCertificate.name === 'BLENGILL') {
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 7 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                }
            }
        });
    }
    else if (productValidatedCertificate.name === 'EV') {
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 8 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                }
            }
        });
    }
    else if (productValidatedCertificate.name === 'CE') {
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 9 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                }
            }
        });
    }
    else {
        return prisma_1.default.productcertificate.create({
            data: {
                certificate: {
                    connect: { id: 10 }
                },
                connectedproduct: {
                    connect: { productid: product.id },
                }
            }
        });
    }
};
exports.CreateProductCertificates = CreateProductCertificates;
