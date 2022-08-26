const nodemailer = require("nodemailer");

export const SendEmail = async( text : string) => {
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
    const info = await transporter.sendMail({
        from: "mariavinna123@gmail.com",
        to: "maria.omarsd99@gmail.com",
        subject: "Hello from node",
        text: text,
        html: "<strong>Hello world?</strong>",
        headers: { 'x-myheader': 'test header' }
    });
    // console.log("Message sent: %s", info.response);
}