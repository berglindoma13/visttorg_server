import { Request, Response } from 'express';
import prismaInstance from '../lib/prisma';


export const AddProject = async(req: Request, res: Response) => {

  const { title, address, country, status, ownerEmail } = req.body.data

    await prismaInstance.vistbokProject.create({
        data:{
            title: title,
            address: address,
            country: country,
            status: status,
            ownerEmail: ownerEmail
        }
    })

    console.log('created');
};

export const GetProject = async(req: Request, res: Response) => {

    const projects = await prismaInstance.vistbokProject.findMany({
        where: {
            ownerEmail: "mariaoma@gmail.com"
        }
    })

    console.log("maria project", projects)
  
};