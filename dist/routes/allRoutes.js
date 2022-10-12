"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allRoutes = void 0;
const express_1 = require("express");
const BykoController_1 = require("../controllers/BykoController");
const EbsonController_1 = require("../controllers/EbsonController");
const Postlist_1 = require("../controllers/Postlist");
const loginController_1 = require("../controllers/loginController");
const TengiController_1 = require("../controllers/TengiController");
const ShelgasonController_1 = require("../controllers/ShelgasonController");
const SerefniController_1 = require("../controllers/SerefniController");
// import { InsertAllTestProducts } from '../controllers/testController';
const SmithNorlandController_1 = require("../controllers/SmithNorlandController");
const fs_1 = __importDefault(require("fs"));
const PrismaHelper_1 = require("../helpers/PrismaHelper");
const CommonController_1 = require("../controllers/CommonController");
exports.allRoutes = (0, express_1.Router)();
//ALMENNT
exports.allRoutes.get('/', (req, res) => {
    res.send('Server is up and running here NOW!');
});
exports.allRoutes.post('/api/fixcerts', CommonController_1.UploadValidatedCerts);
//BYKO ROUTES - API
exports.allRoutes.get('/api/byko', BykoController_1.InsertAllBykoProducts);
exports.allRoutes.get('/api/byko/deleteall/products', BykoController_1.DeleteAllProducts);
exports.allRoutes.get('/api/byko/getallcategories', BykoController_1.GetAllCategories);
exports.allRoutes.get('/api/byko/invalidcerts', BykoController_1.GetAllInvalidBykoCertificates);
//EBSON ROUTES - GOOGLE SHEETS
exports.allRoutes.get('/api/ebson', EbsonController_1.InsertAllEbsonProducts);
exports.allRoutes.get('/api/ebson/deletecert', EbsonController_1.DeleteAllEbsonCert);
exports.allRoutes.get('/api/ebson/deleteproducts', EbsonController_1.DeleteAllEbsonProducts);
exports.allRoutes.get('/api/ebson/invalidcerts', EbsonController_1.GetAllInvalidEbsonCertificates);
//TENGI ROUTES - API
exports.allRoutes.get('/api/tengi', TengiController_1.InsertAllTengiProducts);
exports.allRoutes.get('/api/tengi/getallcategories', TengiController_1.GetAllTengiCategories);
exports.allRoutes.get('/api/tengi/deletecert', TengiController_1.DeleteAllTengiCert);
exports.allRoutes.get('/api/tengi/deleteproducts', TengiController_1.DeleteAllTengiProducts);
exports.allRoutes.get('/api/tengi/invalidcerts', TengiController_1.GetAllInvalidTengiCertificates);
//S.Helgason ROUTES - API
exports.allRoutes.get('/api/shelgason', ShelgasonController_1.InsertAllSHelgasonProducts);
exports.allRoutes.get('/api/shelgason/deletecert', ShelgasonController_1.DeleteAllSHelgasonCert);
exports.allRoutes.get('/api/shelgason/deleteproducts', ShelgasonController_1.DeleteAllSHelgasonProducts);
exports.allRoutes.get('/api/shelgason/invalidcerts', ShelgasonController_1.GetAllInvalidSHelgasonCertificates);
//Sérefni ROUTES - API
exports.allRoutes.get('/api/serefni', SerefniController_1.InsertAllSerefniProducts);
exports.allRoutes.get('/api/serefni/deletecert', SerefniController_1.DeleteAllSerefniCert);
exports.allRoutes.get('/api/serefni/deleteproducts', SerefniController_1.DeleteAllSerefniProducts);
exports.allRoutes.get('/api/serefni/invalidcerts', SerefniController_1.GetAllInvalidSerefniCertificates);
//Smith&Norland ROUTES - API
exports.allRoutes.get('/api/smithnorland', SmithNorlandController_1.InsertAllSmithNorlandProducts);
exports.allRoutes.get('/api/smithnorland/getallcategories', SmithNorlandController_1.GetAllSmithNorlandCategories);
exports.allRoutes.get('/api/smithnorland/deletecert', SmithNorlandController_1.DeleteAllSmithNorlandCert);
exports.allRoutes.get('/api/smithnorland/deleteproducts', SmithNorlandController_1.DeleteAllSmithNorlandProducts);
exports.allRoutes.get('/api/smithnorland/invalidcerts', SmithNorlandController_1.GetAllInvalidSmithNorlandCertificates);
// allRoutes.get('/api/test', InsertAllTestProducts);
// allRoutes.get('/api/deletesheets', DeleteAllSheetsProducts);
// allRoutes.get('/api/deletesheetscertificates', DeleteAllSheetsCert);
// companyRoutes.get('/api/testnewindatabase', ProcessNewInDatabase)
// app.post('/api/product/add', fileUpload)
exports.allRoutes.get('/updatecategories', (req, res) => {
    fs_1.default.readFile('writefiles/CurrentCategoryTemplate.json', (err, data) => {
        if (err)
            throw err;
        let datastring = data.toString();
        let categories = JSON.parse(datastring);
        (0, PrismaHelper_1.UpsertAllCategories)(categories);
        res.send('succesfully updated categories');
    });
});
//add to postlist
exports.allRoutes.post('/api/postlist', Postlist_1.Postlist);
// allRoutes.get('/api/sendmail', SendEmail)
//login function
exports.allRoutes.post('/api/login', loginController_1.Login);
