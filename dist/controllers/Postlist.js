"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Postlist = void 0;
const emailValidation_1 = require("../utils/emailValidation");
const prisma_1 = __importDefault(require("../lib/prisma"));
const Postlist = async (req, res) => {
    const { postlistEmail = '', } = req.body;
    if (!postlistEmail) {
        return res.status(400).send('Vantar tölvupóst');
    }
    if (!(0, emailValidation_1.validateEmail)(postlistEmail)) {
        return res.status(400).send('Netfang ekki gilt');
    }
    await prisma_1.default.postlist.create({
        data: {
            email: postlistEmail
        }
    });
    return res.status(200).send('success');
};
exports.Postlist = Postlist;
