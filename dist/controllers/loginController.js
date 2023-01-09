"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Register = exports.Login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const salt = bcryptjs_1.default.genSaltSync(10);
/* Login function */
const Login = async (req, res) => {
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
    const { email, password } = req.body.data;
    const foundUser = await prisma_1.default.vistbokUser.findUnique({
        where: {
            email: email
        }
    });
    if (!!foundUser) {
        console.log('foundUser', foundUser);
        if (bcryptjs_1.default.compareSync(password, foundUser.password) === true) {
            var token = jsonwebtoken_1.default.sign({ email: email, password: foundUser.password, fullname: foundUser.fullname, jobtitle: foundUser.jobtitle, company: foundUser.company }, 'thisisasuperprivatekey000111');
            return res.status(200).send(JSON.stringify(token));
        }
        else {
            return res.status(401).end('password does not match user');
        }
    }
    else {
        return res.status(404).send('user not found');
    }
};
exports.Login = Login;
/* Register function */
const Register = async (req, res) => {
    const { email, password, fullname, jobtitle, company } = req.body.data;
    const hashedPassword = bcryptjs_1.default.hashSync(password, salt);
    // check if user already exists
    const foundUser = await prisma_1.default.vistbokUser.findUnique({
        where: {
            email: email
        }
    });
    //user was found
    if (!!foundUser) {
        return res.status(403).end('user already exists');
    }
    //user was not found - create
    else {
        await prisma_1.default.vistbokUser.create({
            data: {
                email: email,
                password: hashedPassword,
                fullname: fullname,
                jobtitle: jobtitle,
                company: company
            }
        });
        var token = jsonwebtoken_1.default.sign({ email: email, password: hashedPassword, fullname: fullname, jobtitle: jobtitle, company: company }, 'thisisasuperprivatekey000111');
        return res.status(200).send(JSON.stringify(token));
    }
};
exports.Register = Register;
