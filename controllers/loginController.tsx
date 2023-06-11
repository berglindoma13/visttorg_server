import { Request, Response } from 'express';
import jwt from 'jsonwebtoken'
import prismaInstance from '../lib/prisma';
import bcrypt from 'bcryptjs'

const salt = bcrypt.genSaltSync(10)

/* Login function */
export const Login = async(req: Request, res: Response) => {
  //TODO WHEN ISLAND.IS IS CONNECTED
  // const { token } = req.body;
  //new IslandISLogin({ audienceUrl: process.env.BACKEND_URL});    
  // loginIS.verify(token).then(async (token) => {
  //   const { user } = token;
  //   const { authenticationMethod } = user;
  //   const randomUUID = uuidv4();
  //   if (authenticationMethod != 'Rafræn símaskilríki') {
  //     res.redirect(`${process.env.FRONTEND_URL}/mistokst`);
  //   } else {
  //     const userId = await checkIfUserExists(user);
  //     res.redirect(`${process.env.FRONTEND_URL}/login/${randomUUID}/${userId}`);
  //   }        
  // }).catch((err) => {
  //   console.log('Error verifying token');
  //   console.log(err);
  // });

  const { email, password } = req.body.data

  const foundUser = await prismaInstance.vistbokUser.findUnique({
    where: {
      email: email
    }
  })


  if(!!foundUser){
  
    if(bcrypt.compareSync(password, foundUser.password) === true){
      var token = jwt.sign({ id: foundUser.id, email: email, password: foundUser.password, fullname: foundUser.fullname, jobtitle: foundUser.jobtitle, company: foundUser.company }, 'thisisasuperprivatekey000111');
       
      return res.status(200).send(JSON.stringify(token))
    }else{
      return res.status(401).end('password does not match user') 
    }

  }
  else{
    return res.status(404).send('user not found')
  }
};

/* Register function */
export const Register = async(req: Request, res: Response) => {

  const { email, password, fullname, jobtitle, company } = req.body.data

  const hashedPassword = bcrypt.hashSync(password, salt)

  // check if user already exists
  const foundUser = await prismaInstance.vistbokUser.findUnique({
    where: {
      email: email
    }
  })

  //user was found
  if(!!foundUser){
    
    return res.status(403).end('user already exists')
  }
  //user was not found - create
  else{
    
    await prismaInstance.vistbokUser.create({
      data:{
        email: email,
        password: hashedPassword,
        fullname: fullname,
        jobtitle: jobtitle,
        company: company

      }
    })
    
    var token = jwt.sign({ email: email, password: hashedPassword, fullname: fullname, jobtitle: jobtitle, company: company }, 'thisisasuperprivatekey000111');
     
    return res.status(200).send(JSON.stringify(token))
  }
};