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
const BmvallaController_1 = require("../controllers/BmvallaController");
const GksController_1 = require("../controllers/GksController");
const BirgissonController_1 = require("../controllers/BirgissonController");
// import { InsertAllTestProducts } from '../controllers/testController';
const SmithNorlandController_1 = require("../controllers/SmithNorlandController");
const fs_1 = __importDefault(require("fs"));
const PrismaHelper_1 = require("../helpers/PrismaHelper");
const SendEmail_1 = require("../helpers/SendEmail");
const CommonController_1 = require("../controllers/CommonController");
const testController_1 = require("../controllers/testController");
const FagefniController_1 = require("../controllers/FagefniController");
const HTHController_1 = require("../controllers/HTHController");
exports.allRoutes = (0, express_1.Router)();
//ALMENNT
exports.allRoutes.get('/', (req, res) => {
    res.send('Server is up and running here NOW!');
});
exports.allRoutes.post('/api/fixcerts', CommonController_1.UploadValidatedCerts);
// allRoutes.get('/api/certsystemmapper', setProductsToCertificateSystems)
//BYKO ROUTES - API
exports.allRoutes.get('/api/byko', BykoController_1.InsertAllBykoProducts);
exports.allRoutes.get('/api/byko/deleteall/products', BykoController_1.DeleteAllProducts);
exports.allRoutes.get('/api/byko/getallcategories', BykoController_1.GetAllCategories);
exports.allRoutes.get('/api/byko/invalidcerts', BykoController_1.GetAllInvalidBykoCertificates);
exports.allRoutes.get('/api/byko/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('BYKO');
    res.send('succesfull');
});
//TENGI ROUTES - API
exports.allRoutes.get('/api/tengi', TengiController_1.InsertAllTengiProducts);
exports.allRoutes.get('/api/tengi/getallcategories', TengiController_1.GetAllTengiCategories);
exports.allRoutes.get('/api/tengi/deletecert', TengiController_1.DeleteAllTengiCert);
exports.allRoutes.get('/api/tengi/deleteproducts', TengiController_1.DeleteAllTengiProducts);
exports.allRoutes.get('/api/tengi/invalidcerts', TengiController_1.GetAllInvalidTengiCertificates);
exports.allRoutes.get('/api/tengi/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('Tengi');
    res.send('succesfull');
});
//S.Helgason ROUTES - API
exports.allRoutes.get('/api/shelgason', ShelgasonController_1.InsertAllSHelgasonProducts);
exports.allRoutes.get('/api/shelgason/deletecert', ShelgasonController_1.DeleteAllSHelgasonCert);
exports.allRoutes.get('/api/shelgason/deleteproducts', ShelgasonController_1.DeleteAllSHelgasonProducts);
exports.allRoutes.get('/api/shelgason/invalidcerts', ShelgasonController_1.GetAllInvalidSHelgasonCertificates);
exports.allRoutes.get('/api/shelgason/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('S.Helgason');
    res.send('succesfull');
});
//Smith&Norland ROUTES - API
exports.allRoutes.get('/api/smithnorland', SmithNorlandController_1.InsertAllSmithNorlandProducts);
exports.allRoutes.get('/api/smithnorland/getallcategories', SmithNorlandController_1.GetAllSmithNorlandCategories);
exports.allRoutes.get('/api/smithnorland/deletecert', SmithNorlandController_1.DeleteAllSmithNorlandCert);
exports.allRoutes.get('/api/smithnorland/deleteproducts', SmithNorlandController_1.DeleteAllSmithNorlandProducts);
exports.allRoutes.get('/api/smithnorland/invalidcerts', SmithNorlandController_1.GetAllInvalidSmithNorlandCertificates);
exports.allRoutes.get('/api/smithnorland/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('SmithNorland');
    res.send('succesfull');
});
//EBSON ROUTES - GOOGLE SHEETS
exports.allRoutes.get('/api/ebson', EbsonController_1.InsertAllEbsonProducts);
exports.allRoutes.get('/api/ebson/deletecert', EbsonController_1.DeleteAllEbsonCert);
exports.allRoutes.get('/api/ebson/deleteproducts', EbsonController_1.DeleteAllEbsonProducts);
exports.allRoutes.get('/api/ebson/invalidcerts', EbsonController_1.GetAllInvalidEbsonCertificates);
exports.allRoutes.get('/api/ebson/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('Ebson');
    res.send('succesfull');
});
//Sérefni ROUTES - GOOGLE SHEETS
exports.allRoutes.get('/api/serefni', SerefniController_1.InsertAllSerefniProducts);
exports.allRoutes.get('/api/serefni/deletecert', SerefniController_1.DeleteAllSerefniCert);
exports.allRoutes.get('/api/serefni/deleteproducts', SerefniController_1.DeleteAllSerefniProducts);
exports.allRoutes.get('/api/serefni/invalidcerts', SerefniController_1.GetAllInvalidSerefniCertificates);
exports.allRoutes.get('/api/serefni/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('Serefni');
    res.send('succesfull');
});
//BMVallá ROUTES - GOOGLE SHEETS
exports.allRoutes.get('/api/bmvalla', BmvallaController_1.InsertAllBMVallaProducts);
exports.allRoutes.get('/api/bmvalla/deletecert', BmvallaController_1.DeleteAllBMVallaCert);
exports.allRoutes.get('/api/bmvalla/deleteproducts', BmvallaController_1.DeleteAllBMVallaProducts);
exports.allRoutes.get('/api/bmvalla/invalidcerts', BmvallaController_1.GetAllInvalidBMVallaCertificates);
exports.allRoutes.get('/api/bmvalla/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('BMValla');
    res.send('succesfull');
});
//GKS ROUTES - GOOGLE SHEETS
exports.allRoutes.get('/api/gks', GksController_1.InsertAllGksProducts);
exports.allRoutes.get('/api/gks/deletecert', GksController_1.DeleteAllGksCert);
exports.allRoutes.get('/api/gks/deleteproducts', GksController_1.DeleteAllGksProducts);
exports.allRoutes.get('/api/gks/invalidcerts', GksController_1.GetAllInvalidGksCertificates);
exports.allRoutes.get('/api/gks/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('GKS');
    res.send('succesfull');
});
//Birgisson ROUTES - GOOGLE SHEETS
exports.allRoutes.get('/api/birgisson', BirgissonController_1.InsertAllBirgissonProducts);
exports.allRoutes.get('/api/birgisson/deletecert', BirgissonController_1.DeleteAllBirgissonCert);
exports.allRoutes.get('/api/birgisson/deleteproducts', BirgissonController_1.DeleteAllBirgissonProducts);
exports.allRoutes.get('/api/birgisson/invalidcerts', BirgissonController_1.GetAllInvalidBirgissonCertificates);
exports.allRoutes.get('/api/birgisson/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('Birgisson');
    res.send('succesfull');
});
//FAGEFNI ROUTES - GOOGLE SHEETS
exports.allRoutes.get('/api/fagefni', FagefniController_1.InsertAllFagefniProducts);
exports.allRoutes.get('/api/fagefni/deletecert', FagefniController_1.DeleteAllFagefniCert);
exports.allRoutes.get('/api/fagefni/deleteproducts', FagefniController_1.DeleteAllFagefniProducts);
exports.allRoutes.get('/api/fagefni/invalidcerts', FagefniController_1.GetAllInvalidFagefniCertificates);
exports.allRoutes.get('/api/fagefni/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('Fagefni');
    res.send('succesfull');
});
//HTH ROUTES - GOOGLE SHEETS
exports.allRoutes.get('/api/hth', HTHController_1.InsertAllHTHProducts);
exports.allRoutes.get('/api/hth/deletecert', HTHController_1.DeleteAllHTHCert);
exports.allRoutes.get('/api/hth/deleteproducts', HTHController_1.DeleteAllHTHProducts);
exports.allRoutes.get('/api/hth/invalidcerts', HTHController_1.GetAllInvalidHTHCertificates);
exports.allRoutes.get('/api/hth/fixcerts', (req, res) => {
    (0, CommonController_1.FixValidatedCerts)('HTH');
    res.send('succesfull');
});
exports.allRoutes.get('/api/test', testController_1.InsertAllTemplateProducts);
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
//send email
exports.allRoutes.get('/api/sendmail', SendEmail_1.SendEmailAPI);
//login function
exports.allRoutes.post('/api/login', loginController_1.Login);
exports.allRoutes.post('/api/register', loginController_1.Register);
