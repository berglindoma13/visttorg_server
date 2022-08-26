import { Router, Request, Response } from 'express';
import { InsertAllBykoProducts, TestProduct, GetAllCategories, DeleteAllProducts, DeleteAllProducCertificates } from '../controllers/BykoController';
// import { InsertAllSheetsProducts, /*ProcessNewInDatabase*/ DeleteAllSheetsProducts, /*DeleteAllSheetsProductCertificates*/ DeleteAllSheetsCert, /*SendEmail*/ } from '../controllers/testController';
import { InsertAllSheetsProducts } from '../controllers/EbsonController'
import { fileUpload } from '../controllers/ProductUploadController'
import { Postlist } from '../controllers/Postlist'

export const allRoutes = Router();

//ALMENNT
allRoutes.get('/', (req: Request, res: Response) => {
  res.send('Server is up and running here!')
})

//BYKO ROUTES
allRoutes.get('/api/byko', InsertAllBykoProducts);
allRoutes.get('/api/testByko', TestProduct)
// app.get('/api/byko/deleteall/categories', byko_controller.DeleteAllCategories);
allRoutes.get('/api/byko/deleteall/products', DeleteAllProducts);
allRoutes.get('/api/byko/deleteall/productcertificates', DeleteAllProducCertificates);
allRoutes.get('/api/byko/getallcategories', GetAllCategories);

//EBSON ROUTES
allRoutes.get('/api/ebson', InsertAllSheetsProducts)

// allRoutes.get('/api/testcontroller', InsertAllSheetsProducts);
// allRoutes.get('/api/deletesheets', DeleteAllSheetsProducts);
// allRoutes.get('/api/deletesheetscertificates', DeleteAllSheetsCert);


// companyRoutes.get('/api/testnewindatabase', ProcessNewInDatabase)

// app.post('/api/product/add', fileUpload)

//add to postlist
allRoutes.post('/api/postlist', Postlist)
// allRoutes.get('/api/sendmail', SendEmail)