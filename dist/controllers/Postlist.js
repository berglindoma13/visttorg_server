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
exports.Postlist = void 0;
const emailValidation_1 = require("../utils/emailValidation");
const prisma_1 = require("../lib/prisma");
const Postlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postlistEmail = '', } = req.body;
    if (!postlistEmail) {
        return res.status(400).send('Vantar tölvupóst');
    }
    if (!(0, emailValidation_1.validateEmail)(postlistEmail)) {
        return res.status(400).send('Netfang ekki gilt');
    }
    prisma_1.prismaInstance.postlist.create({
        data: {
            email: postlistEmail
        }
    });
    return res.status(200).send('success');
});
exports.Postlist = Postlist;
