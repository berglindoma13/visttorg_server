const nodemailer = require("nodemailer");
const Email = require('email-templates');
// const path = require('path');

// import "../emailTemplates/invalidProducts.html";

// import "../emailTemplates/invalidProducts/"

export const SendEmailAPI = async() => {
    SendEmail("María Sendir þér mail");
}

const SendEmail = async( subject: string) => {
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

    const emailTemplate = new Email({ 
        preview: false,
        send: true,
        transport: transporter
    });
    
    // const info = await transporter.sendMail({
    //     from: "mariavinna123@gmail.com",
    //     to: "maria.omarsd99@gmail.com",
    //     subject: subject,
    //     // html: 'invalidProducts',
    //     // template: 'invalidProducts',
    //     // template: 'offerResponse',
    //     html,
    //     headers: { 'x-myheader': 'test header' }
    // });

    emailTemplate.send({
        template: '../emailTemplates/invalidProducts',
        message: {
            to: "maria.omarsd99@gmail.com",
        },
    }).catch(console.error)
    // console.log("Message sent: %s", info.response);
}