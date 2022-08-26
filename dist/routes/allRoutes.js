"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allRoutes = void 0;
const express_1 = require("express");
const BykoController_1 = require("../controllers/BykoController");
// import { InsertAllSheetsProducts, /*ProcessNewInDatabase*/ DeleteAllSheetsProducts, /*DeleteAllSheetsProductCertificates*/ DeleteAllSheetsCert, /*SendEmail*/ } from '../controllers/testController';
const EbsonController_1 = require("../controllers/EbsonController");
const Postlist_1 = require("../controllers/Postlist");
exports.allRoutes = (0, express_1.Router)();
exports.allRoutes.get('/', (req, res) => {
    res.send('Server is up and running here!');
});
//BYKO ROUTES
exports.allRoutes.get('/api/byko', BykoController_1.InsertAllBykoProducts);
exports.allRoutes.get('/api/testByko', BykoController_1.TestProduct);
// app.get('/api/byko/deleteall/categories', byko_controller.DeleteAllCategories);
exports.allRoutes.get('/api/byko/deleteall/products', BykoController_1.DeleteAllProducts);
exports.allRoutes.get('/api/byko/deleteall/productcertificates', BykoController_1.DeleteAllProducCertificates);
exports.allRoutes.get('/api/byko/getallcategories', BykoController_1.GetAllCategories);
//EBSON ROUTES
exports.allRoutes.get('/api/ebson', EbsonController_1.InsertAllSheetsProducts);
// allRoutes.get('/api/testcontroller', InsertAllSheetsProducts);
// allRoutes.get('/api/deletesheets', DeleteAllSheetsProducts);
// allRoutes.get('/api/deletesheetscertificates', DeleteAllSheetsCert);
// companyRoutes.get('/api/testnewindatabase', ProcessNewInDatabase)
// app.post('/api/product/add', fileUpload)
//add to postlist
exports.allRoutes.post('/api/postlist', Postlist_1.Postlist);
// allRoutes.get('/api/sendmail', SendEmail)
