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
exports.SendEmail = void 0;
const nodemailer = require("nodemailer");
const SendEmail = (text) => __awaiter(void 0, void 0, void 0, function* () {
    // send email from test mail now - change so it sends from visttorg and to the correct email
    const hostname = "smtp.gmail.com";
    const username = "mariavinna123@gmail.com";
    const password = "cxapowxvwkejbrzl"; // const password = "marraom123%";
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: hostname,
        auth: {
            user: username,
            pass: password,
        },
    });
    const info = yield transporter.sendMail({
        from: "mariavinna123@gmail.com",
        to: "maria.omarsd99@gmail.com",
        subject: "Hello from node",
        text: text,
        html: "<strong>Hello world?</strong>",
        headers: { 'x-myheader': 'test header' }
    });
    // console.log("Message sent: %s", info.response);
});
exports.SendEmail = SendEmail;
