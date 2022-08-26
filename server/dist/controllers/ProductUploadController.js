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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUpload = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const fileUpload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, productId, company, shortDescription, longDescription, link, brand } = req.body;
    // try {
    //   if(!req.files) {
    //       res.send({
    //           status: false,
    //           message: 'No file uploaded'
    //       });
    //   } else {
    //       let productImage = req.files.productImage;
    //     //   const addedFile = await prisma.attachedFile.create({
    //     //     data: {
    //     //         filebytes: productImage.data,
    //     //         filetype: 'image'
    //     //     },
    //     //   })
    //     //   const newProduct = prisma.product.create({
    //     //       data: {
    //     //           productid: productId,
    //     //           title: name, 
    //     //       }
    //     //   })
    //     //   console.log('addedfile', addedFile)
    //       //send response
    //       res.send({
    //           status: true,
    //           message: 'File is uploaded',
    //           data: {
    //               name: productImage.name,
    //               mimetype: productImage.mimetype,
    //               size: productImage.size
    //           }
    //       });
    //   }
    // } catch (err) {
    //     res.status(500).send(err);
    // }
});
exports.fileUpload = fileUpload;
