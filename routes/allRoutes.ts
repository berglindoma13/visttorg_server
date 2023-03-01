import { Router, Request, Response } from 'express';
import { InsertAllBykoProducts, GetAllCategories, DeleteAllProducts, GetAllInvalidBykoCertificates } from '../controllers/BykoController';
import { InsertAllEbsonProducts, DeleteAllEbsonCert, DeleteAllEbsonProducts, GetAllInvalidEbsonCertificates } from '../controllers/EbsonController'
import { Postlist } from '../controllers/Postlist'
import { Login, Register } from '../controllers/loginController';
import { DeleteAllTengiCert, DeleteAllTengiProducts, GetAllInvalidTengiCertificates, GetAllTengiCategories, InsertAllTengiProducts } from '../controllers/TengiController';
import { DeleteAllSHelgasonCert, DeleteAllSHelgasonProducts, GetAllInvalidSHelgasonCertificates, InsertAllSHelgasonProducts } from '../controllers/ShelgasonController';
import { DeleteAllSerefniCert, DeleteAllSerefniProducts, GetAllInvalidSerefniCertificates, InsertAllSerefniProducts } from '../controllers/SerefniController';
import { DeleteAllBMVallaCert, DeleteAllBMVallaProducts, GetAllInvalidBMVallaCertificates, InsertAllBMVallaProducts } from '../controllers/BmvallaController';
import { DeleteAllGksCert, DeleteAllGksProducts, GetAllInvalidGksCertificates, InsertAllGksProducts } from '../controllers/GksController';
import { DeleteAllBirgissonCert, DeleteAllBirgissonProducts, GetAllInvalidBirgissonCertificates, InsertAllBirgissonProducts } from '../controllers/BirgissonController';
// import { InsertAllTestProducts } from '../controllers/testController';
import { DeleteAllSmithNorlandCert, DeleteAllSmithNorlandProducts, GetAllInvalidSmithNorlandCertificates, GetAllSmithNorlandCategories, InsertAllSmithNorlandProducts } from '../controllers/SmithNorlandController';
import fs from 'fs'
import { DatabaseCategory } from '../types/databaseModels';
import { UpsertAllCategories } from '../helpers/PrismaHelper';
import { SendEmailAPI } from '../helpers/SendEmail';
import { DeleteOldSanityEntries, FixValidatedCerts, setProductsToCertificateSystems, UploadValidatedCerts } from '../controllers/CommonController';
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
allRoutes.get('/api/byko/fixcerts', (req,res) => {
  FixValidatedCerts('BYKO')
  res.send('succesfull')
})
allRoutes.get('/api/byko/deleteOldSanityCerts', (req,res) => {
  DeleteOldSanityEntries('BYKO', 1)
  res.send('successfull')
})

//TENGI ROUTES - API
allRoutes.get('/api/tengi', InsertAllTengiProducts)
allRoutes.get('/api/tengi/getallcategories', GetAllTengiCategories)
allRoutes.get('/api/tengi/deletecert', DeleteAllTengiCert)
allRoutes.get('/api/tengi/deleteproducts', DeleteAllTengiProducts)
allRoutes.get('/api/tengi/invalidcerts', GetAllInvalidTengiCertificates)
allRoutes.get('/api/tengi/fixcerts', (req,res) => {
  FixValidatedCerts('Tengi')
  res.send('succesfull')
})

//S.Helgason ROUTES - API
allRoutes.get('/api/shelgason', InsertAllSHelgasonProducts)
allRoutes.get('/api/shelgason/deletecert', DeleteAllSHelgasonCert)
allRoutes.get('/api/shelgason/deleteproducts', DeleteAllSHelgasonProducts)
allRoutes.get('/api/shelgason/invalidcerts', GetAllInvalidSHelgasonCertificates)
allRoutes.get('/api/shelgason/fixcerts', (req,res) => {
  FixValidatedCerts('S.Helgason')
  res.send('succesfull')
})
allRoutes.get('/api/shelgason/deleteOldSanityCerts', (req,res) => {
  DeleteOldSanityEntries('S.Helgason', 5)
  res.send('successfull')
})

//Smith&Norland ROUTES - API
allRoutes.get('/api/smithnorland', InsertAllSmithNorlandProducts)
allRoutes.get('/api/smithnorland/getallcategories', GetAllSmithNorlandCategories)
allRoutes.get('/api/smithnorland/deletecert', DeleteAllSmithNorlandCert)
allRoutes.get('/api/smithnorland/deleteproducts', DeleteAllSmithNorlandProducts)
allRoutes.get('/api/smithnorland/invalidcerts', GetAllInvalidSmithNorlandCertificates)
allRoutes.get('/api/smithnorland/fixcerts', (req,res) => {
  FixValidatedCerts('SmithNorland')
  res.send('succesfull')
})

//EBSON ROUTES - GOOGLE SHEETS
allRoutes.get('/api/ebson', InsertAllEbsonProducts)
allRoutes.get('/api/ebson/deletecert', DeleteAllEbsonCert)
allRoutes.get('/api/ebson/deleteproducts', DeleteAllEbsonProducts)
allRoutes.get('/api/ebson/invalidcerts', GetAllInvalidEbsonCertificates)
allRoutes.get('/api/ebson/fixcerts', (req,res) => {
  FixValidatedCerts('Ebson')
  res.send('succesfull')
})
allRoutes.get('/api/ebson/deleteOldSanityCerts', (req,res) => {
  DeleteOldSanityEntries('Ebson', 2)
  res.send('successfull')
})

//Sérefni ROUTES - GOOGLE SHEETS
allRoutes.get('/api/serefni', InsertAllSerefniProducts)
allRoutes.get('/api/serefni/deletecert', DeleteAllSerefniCert)
allRoutes.get('/api/serefni/deleteproducts', DeleteAllSerefniProducts)
allRoutes.get('/api/serefni/invalidcerts', GetAllInvalidSerefniCertificates)
allRoutes.get('/api/serefni/fixcerts', (req,res) => {
  FixValidatedCerts('Serefni')
  res.send('succesfull')
})
allRoutes.get('/api/serefni/deleteOldSanityCerts', (req,res) => {
  DeleteOldSanityEntries('Serefni', 6)
  res.send('successfull')
})

//BMVallá ROUTES - GOOGLE SHEETS
allRoutes.get('/api/bmvalla', InsertAllBMVallaProducts)
allRoutes.get('/api/bmvalla/deletecert', DeleteAllBMVallaCert)
allRoutes.get('/api/bmvalla/deleteproducts', DeleteAllBMVallaProducts)
allRoutes.get('/api/bmvalla/invalidcerts', GetAllInvalidBMVallaCertificates)
allRoutes.get('/api/bmvalla/fixcerts', (req,res) => {
  FixValidatedCerts('BMValla')
  res.send('succesfull')
})

//GKS ROUTES - GOOGLE SHEETS
allRoutes.get('/api/gks', InsertAllGksProducts)
allRoutes.get('/api/gks/deletecert', DeleteAllGksCert)
allRoutes.get('/api/gks/deleteproducts', DeleteAllGksProducts)
allRoutes.get('/api/gks/invalidcerts', GetAllInvalidGksCertificates)
allRoutes.get('/api/gks/fixcerts', (req,res) => {
  FixValidatedCerts('GKS')
  res.send('succesfull')
})

//Birgisson ROUTES - GOOGLE SHEETS
allRoutes.get('/api/birgisson', InsertAllBirgissonProducts)
allRoutes.get('/api/birgisson/deletecert', DeleteAllBirgissonCert)
allRoutes.get('/api/birgisson/deleteproducts', DeleteAllBirgissonProducts)
allRoutes.get('/api/birgisson/invalidcerts', GetAllInvalidBirgissonCertificates)
allRoutes.get('/api/birgisson/fixcerts', (req,res) => {
  FixValidatedCerts('Birgisson')
  res.send('succesfull')
})
allRoutes.get('/api/birgisson/deleteOldSanityCerts', (req,res) => {
  DeleteOldSanityEntries('Birgisson', 9)
  res.send('successfull')
})

//FAGEFNI ROUTES - GOOGLE SHEETS
allRoutes.get('/api/fagefni', InsertAllFagefniProducts)
allRoutes.get('/api/fagefni/deletecert', DeleteAllFagefniCert)
allRoutes.get('/api/fagefni/deleteproducts', DeleteAllFagefniProducts)
allRoutes.get('/api/fagefni/invalidcerts', GetAllInvalidFagefniCertificates)
allRoutes.get('/api/fagefni/fixcerts', (req,res) => {
  FixValidatedCerts('Fagefni')
  res.send('succesfull')
})

//HTH ROUTES - GOOGLE SHEETS
allRoutes.get('/api/hth', InsertAllHTHProducts)
allRoutes.get('/api/hth/deletecert', DeleteAllHTHCert)
allRoutes.get('/api/hth/deleteproducts', DeleteAllHTHProducts)
allRoutes.get('/api/hth/invalidcerts', GetAllInvalidHTHCertificates)
allRoutes.get('/api/hth/fixcerts', (req,res) => {
  FixValidatedCerts('HTH')
  res.send('succesfull')
})


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
allRoutes.post('/api/register', Register)