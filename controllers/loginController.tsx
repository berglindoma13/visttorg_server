import jwt from 'jsonwebtoken'
import prismaInstance from '../lib/prisma';

/* Login function */
export const Login = (req, res) => {
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

  const { username, password } = req.body

  const foundUser = prismaInstance.vistbokUser.findUnique({
    where: {
      username: username
    }
  })


  if(!!foundUser){
    var token = jwt.sign({ username: username }, 'thisisasuperprivatekey000111');
     
    return res.status(200).send(JSON.stringify(token))
  }
  else{
    return res.status(500).send('usernotfound')
  }
};