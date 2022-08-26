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
exports.GetAllProductsByCompanyid = exports.GetUniqueProduct = exports.UpsertProduct = exports.DeleteProductCertificates = exports.DeleteProduct = exports.DeleteAllCertByCompany = exports.DeleteAllProductsByCompany = void 0;
const prisma_1 = require("../lib/prisma");
const DeleteAllProductsByCompany = (companyid) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all products with given company id
    yield prisma_1.prismaInstance.product.deleteMany({
        where: {
            companyid: companyid
        }
    });
});
exports.DeleteAllProductsByCompany = DeleteAllProductsByCompany;
const DeleteAllCertByCompany = (companyid) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all product certificates connected to given company id
    yield prisma_1.prismaInstance.productcertificate.deleteMany({
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
    yield prisma_1.prismaInstance.product.delete({
        where: {
            productid: productid
        }
    });
});
exports.DeleteProduct = DeleteProduct;
const DeleteProductCertificates = (productid) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all product certificates of a specific product i.e from product id and company id
    // await prismaInstance.productcertificate.deleteMany({
    //   where: {
    //     connectedproduct: {
    //       companyid: 2
    //     },
    //     productid : id 
    //   }
    // })
    yield prisma_1.prismaInstance.productcertificate.deleteMany({
        where: {
            productid: productid
        }
    });
});
exports.DeleteProductCertificates = DeleteProductCertificates;
const UpsertProduct = (product, approved, companyid) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prismaInstance.product.upsert({
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
                connect: { name: product.fl }
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
                connect: { name: product.fl }
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
const GetUniqueProduct = (productid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prismaInstance.product.findUnique({
        where: { productid: productid },
        include: { certificates: {
                include: {
                    certificate: true
                }
            } }
    });
});
exports.GetUniqueProduct = GetUniqueProduct;
const GetAllProductsByCompanyid = (companyid) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prismaInstance.product.findMany({
        where: { companyid: companyid }
    });
});
exports.GetAllProductsByCompanyid = GetAllProductsByCompanyid;
