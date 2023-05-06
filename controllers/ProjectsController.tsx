import { Request, Response } from 'express';
import prismaInstance from '../lib/prisma';


export const AddProject = async(req: Request, res: Response) => {

  const { title, certificatesystem, address, country, status, ownerEmail } = req.body.data

//   console.log("certificite system", certificatesystem)

    await prismaInstance.vistbokProject.create({
        data:{
            title: title,
            certificatesystem: certificatesystem,
            address: address,
            country: country,
            status: status,
            ownerEmail: ownerEmail
        }
    })

    console.log('created');
};


export const UpdateProject = async(req: Request, res: Response) => {

    const { oldTitle, title, certificatesystem, address, country, status, ownerEmail } = req.body.data
  
    // console.log("req boy data", req.body.data )
  
      await prismaInstance.vistbokProject.update({
            where: { projectIdentifier : { title: oldTitle, ownerEmail: ownerEmail }},
            data:{
                title: title,
                certificatesystem: certificatesystem,
                address: address,
                country: country,
                status: status,
                ownerEmail: ownerEmail
            }
        })
  
      console.log('updated');
};

export const DeleteProject = async(req: Request, res: Response) => {

    const { title, ownerEmail } = req.body.data
  
    // console.log("req boy data", req.body.data )
  
      await prismaInstance.vistbokProject.delete({
            where: { projectIdentifier : { title: title, ownerEmail: ownerEmail }}
        })
  
      console.log('deleted');
};

export const GetProject = async(req: Request, res: Response) => {

    const projects = await prismaInstance.vistbokProject.findMany({
        where: {
            ownerEmail: "mariaoma@gmail.com"
        }
    })

    console.log("maria project", projects)
  
};