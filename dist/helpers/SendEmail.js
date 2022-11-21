"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmailToCompanies = exports.SendEmailAPI = void 0;
const nodemailer = require("nodemailer");
const Email = require('email-templates');
const prisma_1 = __importDefault(require("../lib/prisma"));
const SendEmailAPI = async (req, res) => {
    GetInvalidProductsAndSendEmail();
    return res.status(200).send('email sent');
};
exports.SendEmailAPI = SendEmailAPI;
const SendEmailToCompanies = async () => {
    GetInvalidProductsAndSendEmail();
};
exports.SendEmailToCompanies = SendEmailToCompanies;
const GetInvalidProductsAndSendEmail = async () => {
    const filterValidDate = (val) => {
        if (val.certificateid === 1 || val.certificateid === 2 || val.certificateid === 3) {
            return val.validDate == null || val.validDate < new Date();
        }
        else {
            return false;
        }
    };
    // get all products and their certificates
    const AllProducts = await prisma_1.default.product.findMany({
        include: {
            certificates: {
                include: {
                    certificate: true
                }
            }
        }
    });
    // get all companies
    const Companies = await prisma_1.default.company.findMany();
    // remove valid certificates from product and only leave the invalid ones
    const filteredProductList = AllProducts.map(prod => {
        const filteredCertificates = prod.certificates.filter(filterValidDate);
        prod.certificates = filteredCertificates;
        return prod;
    });
    const invalidProducts = [];
    // get the products with invalid certificates and add them to a new array
    filteredProductList.filter(prod => {
        if (prod.certificates.length > 0) {
            invalidProducts.push({ compid: prod.companyid, productid: prod.productid });
        }
    });
    const invalidProductsByCompany = [];
    Companies.map(comp => {
        var comp_temp_invalidproducts = [];
        invalidProducts.map(prod => {
            if (comp.id == prod.compid) {
                comp_temp_invalidproducts.push(prod.productid);
            }
        });
        invalidProductsByCompany.push({ compid: comp.id, products: comp_temp_invalidproducts, to: comp.contact });
    });
    // send email to companies with invalid products
    invalidProductsByCompany.forEach(i => {
        if (i.products.length !== 0) {
            SendEmail(i.products, i.to);
        }
    });
};
const SendEmail = async (productlist, emailTo) => {
    // send email from test mail now - change so it sends from visttorg and to the correct email
    const hostname = "smtp.gmail.com";
    const username = "mariavinna123@gmail.com";
    const password = "cxapowxvwkejbrzl"; // const password = "marraom123%";
    var test = productlist.toString();
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: hostname,
        auth: {
            user: username,
            pass: password,
        },
    });
    const emailTemplate = new Email({
        preview: false,
        send: true,
        transport: transporter,
        message: {
            attachments: [{
                    filename: 'Vorur.txt',
                    content: test,
                }]
        }
    });
    emailTemplate.send({
        template: '../emailTemplates/invalidProducts',
        message: {
            to: emailTo,
        },
    }).catch(console.error);
    // console.log("Message sent: %s", info.response);
};
