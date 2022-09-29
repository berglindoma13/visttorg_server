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
exports.GetAllInvalidProductCertsByCompanyAndCertId = exports.GetAllInvalidProductCertsByCompany = exports.GetAllProductsByCompanyid = exports.GetUniqueProduct = exports.UpsertProduct = exports.DeleteProductCertificates = exports.DeleteProduct = exports.DeleteAllCertByCompany = exports.DeleteAllProductsByCompany = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const DeleteAllProductsByCompany = (companyid) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all products with given company id
    return yield prisma_1.default.product.deleteMany({
        where: {
            companyid: companyid
        }
    });
});
exports.DeleteAllProductsByCompany = DeleteAllProductsByCompany;
const DeleteAllCertByCompany = (companyid) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all product certificates connected to given company id
    return yield prisma_1.default.productcertificate.deleteMany({
        where: {
            connectedproduct: {
                companyid: companyid
            }
        }
    });
});
exports.DeleteAllCertByCompany = DeleteAllCertByCompany;
const DeleteProduct = (productid) => __awaiter(void 0, void 0, void 0, function* () {
    // delete product with given product id
    return yield prisma_1.default.product.delete({
        where: {
            productid: productid
        }
    });
});
exports.DeleteProduct = DeleteProduct;
const DeleteProductCertificates = (productid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.productcertificate.deleteMany({
        where: {
            productid: productid
        }
    });
});
exports.DeleteProductCertificates = DeleteProductCertificates;
const UpsertProduct = (product, approved, companyid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.product.upsert({
        where: {
            productid: product.id
        },
        update: {
            approved: approved,
            title: product.prodName,
            productid: product.id,
            sellingcompany: {
                connect: { id: companyid }
            },
            categories: {
                connect: typeof product.fl === 'string' ? { name: product.fl } : product.fl
            },
            description: product.longDescription,
            shortdescription: product.shortDescription,
            productimageurl: product.prodImage,
            url: product.url,
            brand: product.brand,
            updatedAt: new Date()
        },
        create: {
            title: product.prodName,
            productid: product.id,
            sellingcompany: {
                connect: { id: companyid }
            },
            categories: {
                connect: typeof product.fl === 'string' ? { name: product.fl } : product.fl
            },
            description: product.longDescription,
            shortdescription: product.shortDescription,
            productimageurl: product.prodImage,
            url: product.url,
            brand: product.brand,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    });
});
exports.UpsertProduct = UpsertProduct;
const GetUniqueProduct = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.product.findUnique({
        where: { productid: productId },
        include: { certificates: {
                include: {
                    certificate: true
                }
            } }
    });
});
exports.GetUniqueProduct = GetUniqueProduct;
const GetAllProductsByCompanyid = (companyid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.product.findMany({
        where: { companyid: companyid }
    });
});
exports.GetAllProductsByCompanyid = GetAllProductsByCompanyid;
const GetAllInvalidProductCertsByCompany = (companyid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.productcertificate.findMany({
        where: {
            validDate: null,
            certificateid: {
                in: [1, 2, 3]
            },
            connectedproduct: {
                companyid: companyid
            }
        }
    });
});
exports.GetAllInvalidProductCertsByCompany = GetAllInvalidProductCertsByCompany;
const GetAllInvalidProductCertsByCompanyAndCertId = (companyid, certId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.productcertificate.findMany({
        where: {
            validDate: null,
            certificateid: certId,
            connectedproduct: {
                companyid: companyid
            }
        }
    });
});
exports.GetAllInvalidProductCertsByCompanyAndCertId = GetAllInvalidProductCertsByCompanyAndCertId;
