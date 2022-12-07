import { Router, Request, Response } from 'express';
import { InsertAllBykoProducts, GetAllCategories, DeleteAllProducts, GetAllInvalidBykoCertificates } from '../controllers/BykoController';
import { InsertAllEbsonProducts, DeleteAllEbsonCert, DeleteAllEbsonProducts, GetAllInvalidEbsonCertificates } from '../controllers/EbsonController'
import { Postlist } from '../controllers/Postlist'
import { Login } from '../controllers/loginController';
import { DeleteAllTengiCert, DeleteAllTengiProducts, GetAllInvalidTengiCertificates, GetAllTengiCategories, InsertAllTengiProducts } from '../controllers/TengiController';
import { DeleteAllSHelgasonCert, DeleteAllSHelgasonProducts, GetAllInvalidSHelgasonCertificates, InsertAllSHelgasonProducts } from '../controllers/ShelgasonController';
import { DeleteAllSerefniCert, DeleteAllSerefniProducts, GetAllInvalidSerefniCertificates, InsertAllSerefniProducts } from '../controllers/SerefniController';
import { DeleteAllBMVallaCert, DeleteAllBMVallaProducts, GetAllInvalidBMVallaCertificates, InsertAllBMVallaProducts } from '../controllers/BmvallaController';
import { DeleteAllGksCert, DeleteAllGksProducts, GetAllInvalidGksCertificates, InsertAllGksProducts } from '../controllers/GksController';
import { DeleteAllBirgissonCert, DeleteAllBirgissonProducts, GetAllInvalidBirgissonCertificates, InsertAllBirgissonProducts } from '../controllers/BirgissonController';
// import { InsertAllTestProducts } from '../controllers/testController';
import { DeleteAllSmithNorlandCert, DeleteAllSmithNorlandProducts, GetAllInvalidSmithNorlandCertificates, GetAllSmithNorlandCategories, InsertAllSmithNorlandProducts } from '../controllers/SmithNorlandController';
import fs from 'fs'
import { DatabaseCategory } from '../types/models';
import { UpsertAllCategories } from '../helpers/PrismaHelper';
import { SendEmailAPI } from '../helpers/SendEmail';
import { setProductsToCertificateSystems, UploadValidatedCerts } from '../controllers/CommonController';
import { InsertAllTemplateProducts } from '../controllers/testController';
import { DeleteAllFagefniCert, DeleteAllFagefniProducts, GetAllInvalidFagefniCertificates, InsertAllFagefniProducts } from '../controllers/FagefniController';
import { DeleteAllHTHCert, DeleteAllHTHProducts, GetAllInvalidHTHCertificates, InsertAllHTHProducts } from '../controllers/HTHController';

export const allRoutes = Router();

//ALMENNT
allRoutes.get('/', (req: Request, res: Response) => {
  res.send('Server is up and running here NOW!')
})
allRoutes.post('/api/fixcerts', UploadValidatedCerts)
// allRoutes.get('/api/certsystemmapper', setProductsToCertificateSystems)

//BYKO ROUTES - API
allRoutes.get('/api/byko', InsertAllBykoProducts);
allRoutes.get('/api/byko/deleteall/products', DeleteAllProducts);
allRoutes.get('/api/byko/getallcategories', GetAllCategories);
allRoutes.get('/api/byko/invalidcerts', GetAllInvalidBykoCertificates)

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

//Smith&Norland ROUTES - API
allRoutes.get('/api/smithnorland', InsertAllSmithNorlandProducts)
allRoutes.get('/api/smithnorland/getallcategories', GetAllSmithNorlandCategories)
allRoutes.get('/api/smithnorland/deletecert', DeleteAllSmithNorlandCert)
allRoutes.get('/api/smithnorland/deleteproducts', DeleteAllSmithNorlandProducts)
allRoutes.get('/api/smithnorland/invalidcerts', GetAllInvalidSmithNorlandCertificates)

//EBSON ROUTES - GOOGLE SHEETS
allRoutes.get('/api/ebson', InsertAllEbsonProducts)
allRoutes.get('/api/ebson/deletecert', DeleteAllEbsonCert)
allRoutes.get('/api/ebson/deleteproducts', DeleteAllEbsonProducts)
allRoutes.get('/api/ebson/invalidcerts', GetAllInvalidEbsonCertificates)

//Sérefni ROUTES - GOOGLE SHEETS
allRoutes.get('/api/serefni', InsertAllSerefniProducts)
allRoutes.get('/api/serefni/deletecert', DeleteAllSerefniCert)
allRoutes.get('/api/serefni/deleteproducts', DeleteAllSerefniProducts)
allRoutes.get('/api/serefni/invalidcerts', GetAllInvalidSerefniCertificates)

//BMVallá ROUTES - GOOGLE SHEETS
allRoutes.get('/api/bmvalla', InsertAllBMVallaProducts)
allRoutes.get('/api/bmvalla/deletecert', DeleteAllBMVallaCert)
allRoutes.get('/api/bmvalla/deleteproducts', DeleteAllBMVallaProducts)
allRoutes.get('/api/bmvalla/invalidcerts', GetAllInvalidBMVallaCertificates)

//GKS ROUTES - GOOGLE SHEETS
allRoutes.get('/api/gks', InsertAllGksProducts)
allRoutes.get('/api/gks/deletecert', DeleteAllGksCert)
allRoutes.get('/api/gks/deleteproducts', DeleteAllGksProducts)
allRoutes.get('/api/gks/invalidcerts', GetAllInvalidGksCertificates)

//Birgisson ROUTES - GOOGLE SHEETS
allRoutes.get('/api/birgisson', InsertAllBirgissonProducts)
allRoutes.get('/api/birgisson/deletecert', DeleteAllBirgissonCert)
allRoutes.get('/api/birgisson/deleteproducts', DeleteAllBirgissonProducts)
allRoutes.get('/api/birgisson/invalidcerts', GetAllInvalidBirgissonCertificates)

//FAGEFNI ROUTES - GOOGLE SHEETS
allRoutes.get('/api/fagefni', InsertAllFagefniProducts)
allRoutes.get('/api/fagefni/deletecert', DeleteAllFagefniCert)
allRoutes.get('/api/fagefni/deleteproducts', DeleteAllFagefniProducts)
allRoutes.get('/api/fagefni/invalidcerts', GetAllInvalidFagefniCertificates)

//HTH ROUTES - GOOGLE SHEETS
allRoutes.get('/api/hth', InsertAllHTHProducts)
allRoutes.get('/api/hth/deletecert', DeleteAllHTHCert)
allRoutes.get('/api/hth/deleteproducts', DeleteAllHTHProducts)
allRoutes.get('/api/hth/invalidcerts', GetAllInvalidHTHCertificates)


allRoutes.get('/api/test', InsertAllTemplateProducts);
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