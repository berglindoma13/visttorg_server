import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

export const fileUpload = async(req: Request, res: Response) => {
    const { name, productId, company, shortDescription, longDescription, link, brand } = req.body
    
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
}