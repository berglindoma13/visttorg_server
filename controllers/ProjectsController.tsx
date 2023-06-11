import { Request, Response } from 'express';
import prismaInstance from '../lib/prisma';


export const AddProject = async(req: Request, res: Response) => {

  const { title, certificatesystem, address, country, status, ownerEmail } = req.body.data

//   console.log("certificite system", certificatesystem)

    const newProject = await prismaInstance.vistbokProject.create({
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
    return res.status(200).send(JSON.stringify(newProject.id))
};


export const UpdateProject = async(req: Request, res: Response) => {

    const { title, certificatesystem, address, country, status, ownerEmail } = req.body.data
    const { id } = req.params
    
      await prismaInstance.vistbokProject.update({
            where: { 
                id: parseInt(id)},
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
      return res.status(200)
};

export const DeleteProject = async(req: Request, res: Response) => {

    const { id } = req.params
  
      await prismaInstance.vistbokProject.delete({
            where: { id: parseInt(id)}
        })
  
      console.log('deleted');
      return res.status(200)
};

export const GetProject = async(req: Request, res: Response) => {

    const projects = await prismaInstance.vistbokProject.findMany({
        where: {
            ownerEmail: "mariaoma@gmail.com"
        }
    })

    console.log("maria project", projects)
  
};