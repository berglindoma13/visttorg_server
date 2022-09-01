"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAllTengiCert = exports.DeleteAllTengiProducts = exports.InsertAllTengiProducts = void 0;
const axios_1 = __importDefault(require("axios"));
const PrismaHelper_1 = require("../helpers/PrismaHelper");
// TENGI COMPANY ID = 4
const TengiAPI = "https://api.integrator.is/Products/GetMany/?CompanyId=608c19f3591c2b328096b230&ApiKey=b3a6e86d4d4d6612b55d436f7fa60c65d0f8f217c34ead6333407162d308982b&Status=2&Brands=61efc9d1591c275358c86f84";
var updatedProducts = [];
var createdProducts = [];
var productsNotValid = [];
const InsertAllTengiProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tengiData = yield requestTengiApi();
    //process all data and insert into database
    yield ProcessForDatabase(tengiData);
    return res.end("We made it! And it's great");
});
exports.InsertAllTengiProducts = InsertAllTengiProducts;
const DeleteAllTengiProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all products with company id 4
    (0, PrismaHelper_1.DeleteAllProductsByCompany)(4);
    res.end("All Tengi products deleted");
});
exports.DeleteAllTengiProducts = DeleteAllTengiProducts;
const DeleteAllTengiCert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all product certificates connected to company id 4
    (0, PrismaHelper_1.DeleteAllCertByCompany)(4);
    res.end("all product certificates deleted for Tengi");
});
exports.DeleteAllTengiCert = DeleteAllTengiCert;
const requestTengiApi = () => __awaiter(void 0, void 0, void 0, function* () {
    return axios_1.default.get(TengiAPI).then(response => {
        if (response.status === 200) {
            // breyta úr any í tengiResponseData
            const data = response;
            // console.log('DATA', data.data)
            return data.data;
        }
        else {
            console.log(`Error occured : ${response.status} - ${response.statusText}`);
        }
    });
});
// const getcat = async(data) => {
//   var categories = []
//   data.map(prod => {
//     // console.log('prod', prod.fl)
//     prod.fl.map(cat => {
//       // console.log('cat', cat.Name)
//       if(!categories.includes(cat.Name)) {
//         categories.push(cat.Name)
//       }
//     })
//   })
//   console.log(categories)
// }
// // WRITE FILES MISSING HERE
// const next = async(data) => {
//   // console.log('DATA', data)
//   // data.map( => {
//   //   // console.log('her', af.fl)
//   //   getcat(data)
//   // })
//   getcat(data)
// }
const ProcessForDatabase = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("DATA NUNA",data.Data)
    const allprod = [];
    data.Data.map(prod => {
        // console.log('PROD', prod.Attachments)
        var temp_prod = {
            id: prod.Id,
            prodName: prod.StandardFields.Name,
            longDescription: prod.StandardFields.Description,
            shortDescription: prod.StandardFields.ShortDescription,
            fl: prod.StandardFields.Categories,
            prodImage: prod.Images[0].Url,
            url: 'vantar',
            brand: prod.StandardFields.Brands,
            fscUrl: "vantar",
            epdUrl: "vantar",
            vocUrl: "vantar",
            ceUrl: "vantar",
            certificates: [
                { name: "fsc", val: "FALSE" },
                { name: "epd", val: "FALSE" },
                { name: "voc", val: "FALSE" },
                { name: "sv_allowed", val: "FALSE" },
                { name: "sv", val: "FALSE" },
                { name: "breeam", val: "FALSE" },
                { name: "blengill", val: "FALSE" },
                { name: "ev", val: "FALSE" },
                { name: "ce", val: "TRUE" }
            ]
        };
        allprod.push(temp_prod);
    });
    // console.log('ALL prods', allprod)
    //   next(allprod)
});
