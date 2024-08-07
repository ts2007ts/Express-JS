const nodemailer = require('nodemailer');

const sendEmail = async (option) => {
    //1. Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    //2. Define email options
    const emailOptions = {
        from: 'Tarek Support <tarek@gmail.com>',
        to: option.email,
        subject: option.subject,
        text: option.message
    }

    //3. send the email
    await transporter.sendMail(emailOptions);

}


module.exports = sendEmail;