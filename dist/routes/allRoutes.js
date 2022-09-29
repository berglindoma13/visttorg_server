"use strict";
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
const testController_1 = require("../controllers/testController");
exports.allRoutes = (0, express_1.Router)();
//ALMENNT
exports.allRoutes.get('/', (req, res) => {
    res.send('Server is up and running here!');
});
//BYKO ROUTES - API
exports.allRoutes.get('/api/byko', BykoController_1.InsertAllBykoProducts);
exports.allRoutes.get('/api/byko/deleteall/products', BykoController_1.DeleteAllProducts);
exports.allRoutes.get('/api/byko/getallcategories', BykoController_1.GetAllCategories);
exports.allRoutes.get('/api/byko/invalidcerts', BykoController_1.GetAllInvalidBykoCertificates);
exports.allRoutes.get('/api/byko/invalidcerts/epd', BykoController_1.GetAllInvalidBykoCertificatesByCertId);
//EBSON ROUTES - GOOGLE SHEETS
exports.allRoutes.get('/api/ebson', EbsonController_1.InsertAllEbsonProducts);
exports.allRoutes.get('/api/ebson/deletecert', EbsonController_1.DeleteAllEbsonCert);
exports.allRoutes.get('/api/ebson/deleteproducts', EbsonController_1.DeleteAllEbsonProducts);
//TENGI ROUTES - API
exports.allRoutes.get('/api/tengi', TengiController_1.InsertAllTengiProducts);
exports.allRoutes.get('/api/tengi/getallcategories', TengiController_1.GetAllTengiCategories);
exports.allRoutes.get('/api/tengi/deletecert', TengiController_1.DeleteAllTengiCert);
exports.allRoutes.get('/api/tengi/deleteproducts', TengiController_1.DeleteAllTengiProducts);
//S.Helgason ROUTES - API
exports.allRoutes.get('/api/shelgason', ShelgasonController_1.InsertAllSHelgasonProducts);
exports.allRoutes.get('/api/shelgason/deletecert', ShelgasonController_1.DeleteAllSHelgasonCert);
exports.allRoutes.get('/api/shelgason/deleteproducts', ShelgasonController_1.DeleteAllSHelgasonProducts);
//Sérefni ROUTES - API
exports.allRoutes.get('/api/serefni', SerefniController_1.InsertAllSerefniProducts);
exports.allRoutes.get('/api/serefni/deletecert', SerefniController_1.DeleteAllSerefniCert);
exports.allRoutes.get('/api/serefni/deleteproducts', SerefniController_1.DeleteAllSerefniProducts);
exports.allRoutes.get('/api/test', testController_1.InsertAllTestProducts);
// allRoutes.get('/api/deletesheets', DeleteAllSheetsProducts);
// allRoutes.get('/api/deletesheetscertificates', DeleteAllSheetsCert);
// companyRoutes.get('/api/testnewindatabase', ProcessNewInDatabase)
// app.post('/api/product/add', fileUpload)
//add to postlist
exports.allRoutes.post('/api/postlist', Postlist_1.Postlist);
// allRoutes.get('/api/sendmail', SendEmail)
//login function
exports.allRoutes.post('/api/login', loginController_1.Login);
