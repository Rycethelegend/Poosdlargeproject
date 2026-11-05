const nodemailer = require('nodemailer');
require('dotenv').config();

// SMTP settings come from .env (see .env.example). Any SMTP provider works:
// a Gmail account with an app password, SendGrid's SMTP relay, Brevo, etc.
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

const transporter = SMTP_HOST
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
    : null;

if (!transporter) {
    console.warn('SMTP_HOST is not set: verification codes will be printed to this console instead of emailed.');
}

const SUBJECTS = {
    register: 'Your Poosdalatro verification code',
    reset: 'Your Poosdalatro password reset code',
};

const INTROS = {
    register: 'Use this code to finish creating your Poosdalatro account:',
    reset: 'Use this code to reset your Poosdalatro password:',
};

// Sends a one-time code. purpose is 'register' or 'reset'.
exports.sendCodeEmail = async function (to, code, purpose, minutesValid) {
    const intro = INTROS[purpose];
    const footer = `This code expires in ${minutesValid} minutes. If you didn't ask for it, you can ignore this email.`;

    if (!transporter) {
        console.log(`[dev email] ${purpose} code for ${to}: ${code}`);
        return;
    }

    await transporter.sendMail({
        from: MAIL_FROM || SMTP_USER,
        to: to,
        subject: SUBJECTS[purpose],
        text: `${intro}\n\n${code}\n\n${footer}`,
        html: `<p>${intro}</p>`
            + `<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>`
            + `<p style="color:#666">${footer}</p>`,
    });
}
