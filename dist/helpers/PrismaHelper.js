"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertAllCategories = exports.GetAllInvalidProductCertsByCompanyAndCertId = exports.GetAllInvalidProductCertsByCompany = exports.GetAllProductsByCompanyid = exports.GetUniqueProduct = exports.DeleteProductCertificates = exports.DeleteProduct = exports.DeleteAllCertByCompany = exports.DeleteAllProductsByCompany = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const DeleteAllProductsByCompany = async (companyid) => {
    // delete all products with given company id
    return await prisma_1.default.product.deleteMany({
        where: {
            companyid: companyid
        }
    });
};
exports.DeleteAllProductsByCompany = DeleteAllProductsByCompany;
const DeleteAllCertByCompany = async (companyid) => {
    // delete all product certificates connected to given company id
    return await prisma_1.default.productcertificate.deleteMany({
        where: {
            connectedproduct: {
                companyid: companyid
            }
        }
    });
};
exports.DeleteAllCertByCompany = DeleteAllCertByCompany;
const DeleteProduct = async (productId, companyId) => {
    // delete product with given product id
    return await prisma_1.default.product.delete({
        where: { productIdentifier: { productid: productId, companyid: companyId } },
    });
};
exports.DeleteProduct = DeleteProduct;
const DeleteProductCertificates = async (productid) => {
    return await prisma_1.default.productcertificate.deleteMany({
        where: {
            productid: productid
        }
    });
};
exports.DeleteProductCertificates = DeleteProductCertificates;
const GetUniqueProduct = async (productId, companyId) => {
    return await prisma_1.default.product.findUnique({
        where: { productIdentifier: { productid: productId, companyid: companyId } },
        include: { certificates: {
                include: {
                    certificate: true
                }
            } }
    });
};
exports.GetUniqueProduct = GetUniqueProduct;
const GetAllProductsByCompanyid = async (companyid) => {
    return await prisma_1.default.product.findMany({
        where: { companyid: companyid }
    });
};
exports.GetAllProductsByCompanyid = GetAllProductsByCompanyid;
const GetAllInvalidProductCertsByCompany = async (companyid) => {
    return await prisma_1.default.productcertificate.findMany({
        where: {
            validDate: null,
            certificateid: {
                in: [1, 2, 3]
            },
            connectedproduct: {
                companyid: companyid
            }
        },
        include: {
            connectedproduct: true
        }
    });
};
exports.GetAllInvalidProductCertsByCompany = GetAllInvalidProductCertsByCompany;
const GetAllInvalidProductCertsByCompanyAndCertId = async (companyid, certId) => {
    return await prisma_1.default.productcertificate.findMany({
        where: {
            validDate: null,
            certificateid: certId,
            connectedproduct: {
                companyid: companyid
            }
        }
    });
};
exports.GetAllInvalidProductCertsByCompanyAndCertId = GetAllInvalidProductCertsByCompanyAndCertId;
const UpsertAllCategories = async (categories) => {
    const allSubCats = categories.map(cat => {
        return cat.subCategories.map(subcat => { return { ...subcat, parent: cat.name }; });
    }).flat();
    await prisma_1.default.$transaction(categories.map(cat => {
        return prisma_1.default.category.upsert({
            where: {
                name: cat.name
            },
            update: {
                name: cat.name
            },
            create: {
                name: cat.name,
            }
        });
    }));
    await prisma_1.default.$transaction(allSubCats.map(subcat => {
        const id = { 'name': subcat.name, 'parentCategoryName': subcat.parent };
        return prisma_1.default.subCategory.upsert({
            where: {
                subCatIdentifier: id
            },
            update: {
                name: subcat.name,
                parentCategoryName: subcat.parent
            },
            create: {
                name: subcat.name,
                parentCategoryName: subcat.parent
            }
        });
    }));
};
exports.UpsertAllCategories = UpsertAllCategories;
