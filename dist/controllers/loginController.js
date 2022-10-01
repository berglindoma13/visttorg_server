"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Register = exports.Login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
/* Login function */
const Login = (req, res) => {
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
    const { username, password } = req.body;
    const foundUser = prisma_1.default.vistbokUser.findUnique({
        where: {
            username: username
        }
    });
    if (!!foundUser) {
        var token = jsonwebtoken_1.default.sign({ username: username }, 'thisisasuperprivatekey000111');
        return res.status(200).send(JSON.stringify(token));
    }
    else {
        return res.status(500).send('user not found');
    }
};
exports.Login = Login;
/* Register function */
const Register = (req, res) => {
    const { username, password } = req.body;
    // check if user already exists
    const foundUser = prisma_1.default.vistbokUser.findUnique({
        where: {
            username: username
        }
    });
    //user was found
    if (!!foundUser) {
        return res.status(500).send('user already exists');
    }
    //user was not found - create
    else {
        prisma_1.default.vistbokUser.create({
            data: {
                username: username,
                password: password
            }
        });
        return res.status(200).send('user created');
    }
};
exports.Register = Register;
