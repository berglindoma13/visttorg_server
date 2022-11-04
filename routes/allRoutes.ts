import { Router, Request, Response } from 'express';
import { InsertAllBykoProducts, GetAllCategories, DeleteAllProducts, GetAllInvalidBykoCertificates } from '../controllers/BykoController';
import { InsertAllEbsonProducts, DeleteAllEbsonCert, DeleteAllEbsonProducts, GetAllInvalidEbsonCertificates } from '../controllers/EbsonController'
import { Postlist } from '../controllers/Postlist'
import { Login } from '../controllers/loginController';
import { DeleteAllTengiCert, DeleteAllTengiProducts, GetAllInvalidTengiCertificates, GetAllTengiCategories, InsertAllTengiProducts } from '../controllers/TengiController';
import { DeleteAllSHelgasonCert, DeleteAllSHelgasonProducts, GetAllInvalidSHelgasonCertificates, InsertAllSHelgasonProducts } from '../controllers/ShelgasonController';
import { DeleteAllSerefniCert, DeleteAllSerefniProducts, GetAllInvalidSerefniCertificates, InsertAllSerefniProducts } from '../controllers/SerefniController';
// import { InsertAllTestProducts } from '../controllers/testController';
import { DeleteAllSmithNorlandCert, DeleteAllSmithNorlandProducts, GetAllInvalidSmithNorlandCertificates, GetAllSmithNorlandCategories, InsertAllSmithNorlandProducts } from '../controllers/SmithNorlandController';
import fs from 'fs'
import { DatabaseCategory } from '../types/models';
import { UpsertAllCategories } from '../helpers/PrismaHelper';
import { UploadValidatedCerts } from '../controllers/CommonController';
import { SendEmailAPI } from '../helpers/SendEmail';

export const allRoutes = Router();

//ALMENNT
allRoutes.get('/', (req: Request, res: Response) => {
  res.send('Server is up and running here NOW!')
})
allRoutes.post('/api/fixcerts', UploadValidatedCerts)


//BYKO ROUTES - API
allRoutes.get('/api/byko', InsertAllBykoProducts);
allRoutes.get('/api/byko/deleteall/products', DeleteAllProducts);
allRoutes.get('/api/byko/getallcategories', GetAllCategories);
allRoutes.get('/api/byko/invalidcerts', GetAllInvalidBykoCertificates)

//EBSON ROUTES - GOOGLE SHEETS
allRoutes.get('/api/ebson', InsertAllEbsonProducts)
allRoutes.get('/api/ebson/deletecert', DeleteAllEbsonCert)
allRoutes.get('/api/ebson/deleteproducts', DeleteAllEbsonProducts)
allRoutes.get('/api/ebson/invalidcerts', GetAllInvalidEbsonCertificates)

//TENGI ROUTES - API
allRoutes.get('/api/tengi', InsertAllTengiProducts)
allRoutes.get('/api/tengi/getallcategories', GetAllTengiCategories)
allRoutes.get('/api/tengi/deletecert', DeleteAllTengiCert)
allRoutes.get('/api/tengi/deleteproducts', DeleteAllTengiProducts)
allRoutes.get('/api/tengi/invalidcerts', GetAllInvalidTengiCertificates)

//S.Helgason ROUTES - API
allRoutes.get('/api/shelgason', InsertAllSHelgasonProducts)
allRoutes.get('/api/shelgason/deletecert', DeleteAllSHelgasonCert)
allRoutes.get('/api/shelgason/deleteproducts', DeleteAllSHelgasonProducts)
allRoutes.get('/api/shelgason/invalidcerts', GetAllInvalidSHelgasonCertificates)

//Sérefni ROUTES - API
allRoutes.get('/api/serefni', InsertAllSerefniProducts)
allRoutes.get('/api/serefni/deletecert', DeleteAllSerefniCert)
allRoutes.get('/api/serefni/deleteproducts', DeleteAllSerefniProducts)
allRoutes.get('/api/serefni/invalidcerts', GetAllInvalidSerefniCertificates)

//Smith&Norland ROUTES - API
allRoutes.get('/api/smithnorland', InsertAllSmithNorlandProducts)
allRoutes.get('/api/smithnorland/getallcategories', GetAllSmithNorlandCategories)
allRoutes.get('/api/smithnorland/deletecert', DeleteAllSmithNorlandCert)
allRoutes.get('/api/smithnorland/deleteproducts', DeleteAllSmithNorlandProducts)
allRoutes.get('/api/smithnorland/invalidcerts', GetAllInvalidSmithNorlandCertificates)

// allRoutes.get('/api/test', InsertAllTestProducts);
// allRoutes.get('/api/deletesheets', DeleteAllSheetsProducts);
// allRoutes.get('/api/deletesheetscertificates', DeleteAllSheetsCert);


// companyRoutes.get('/api/testnewindatabase', ProcessNewInDatabase)

// app.post('/api/product/add', fileUpload)

allRoutes.get('/updatecategories', (req, res) => {
  fs.readFile('writefiles/CurrentCategoryTemplate.json', (err, data) => {
    if (err) throw err;
    let datastring: string = data.toString()
    let categories = JSON.parse(datastring);

    UpsertAllCategories(categories)

    res.send('succesfully updated categories')
    
});
})

//add to postlist
allRoutes.post('/api/postlist', Postlist)

//send email
allRoutes.get('/api/sendmail', SendEmailAPI)

//login function
allRoutes.post('/api/login', Login)