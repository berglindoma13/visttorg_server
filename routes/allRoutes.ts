import { Router, Request, Response } from 'express';
import { InsertAllBykoProducts, GetAllCategories, DeleteAllProducts, GetAllInvalidBykoCertificates, GetAllInvalidBykoCertificatesByCertId } from '../controllers/BykoController';
import { InsertAllEbsonProducts, DeleteAllEbsonCert, DeleteAllEbsonProducts } from '../controllers/EbsonController'
import { Postlist } from '../controllers/Postlist'
import { Login } from '../controllers/loginController';
import { DeleteAllTengiCert, DeleteAllTengiProducts, GetAllTengiCategories, InsertAllTengiProducts } from '../controllers/TengiController';
import { DeleteAllSHelgasonCert, DeleteAllSHelgasonProducts, InsertAllSHelgasonProducts } from '../controllers/ShelgasonController';
import { DeleteAllSerefniCert, DeleteAllSerefniProducts, InsertAllSerefniProducts } from '../controllers/SerefniController';
import { InsertAllTestProducts } from '../controllers/testController';

export const allRoutes = Router();

//ALMENNT
allRoutes.get('/', (req: Request, res: Response) => {
  res.send('Server is up and running here!')
})

//BYKO ROUTES - API
allRoutes.get('/api/byko', InsertAllBykoProducts);
allRoutes.get('/api/byko/deleteall/products', DeleteAllProducts);
allRoutes.get('/api/byko/getallcategories', GetAllCategories);
allRoutes.get('/api/byko/invalidcerts', GetAllInvalidBykoCertificates)
allRoutes.get('/api/byko/invalidcerts/epd', GetAllInvalidBykoCertificatesByCertId)

//EBSON ROUTES - GOOGLE SHEETS
allRoutes.get('/api/ebson', InsertAllEbsonProducts)
allRoutes.get('/api/ebson/deletecert', DeleteAllEbsonCert)
allRoutes.get('/api/ebson/deleteproducts', DeleteAllEbsonProducts)

//TENGI ROUTES - API
allRoutes.get('/api/tengi', InsertAllTengiProducts)
allRoutes.get('/api/tengi/getallcategories', GetAllTengiCategories)
allRoutes.get('/api/tengi/deletecert', DeleteAllTengiCert)
allRoutes.get('/api/tengi/deleteproducts', DeleteAllTengiProducts)

//S.Helgason ROUTES - API
allRoutes.get('/api/shelgason', InsertAllSHelgasonProducts)
allRoutes.get('/api/shelgason/deletecert', DeleteAllSHelgasonCert)
allRoutes.get('/api/shelgason/deleteproducts', DeleteAllSHelgasonProducts)

//Sérefni ROUTES - API
allRoutes.get('/api/serefni', InsertAllSerefniProducts)
allRoutes.get('/api/serefni/deletecert', DeleteAllSerefniCert)
allRoutes.get('/api/serefni/deleteproducts', DeleteAllSerefniProducts)

allRoutes.get('/api/test', InsertAllTestProducts);
// allRoutes.get('/api/deletesheets', DeleteAllSheetsProducts);
// allRoutes.get('/api/deletesheetscertificates', DeleteAllSheetsCert);


// companyRoutes.get('/api/testnewindatabase', ProcessNewInDatabase)

// app.post('/api/product/add', fileUpload)

//add to postlist
allRoutes.post('/api/postlist', Postlist)
// allRoutes.get('/api/sendmail', SendEmail)

//login function
allRoutes.post('/api/login', Login)