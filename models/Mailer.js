const nodemailer = require('nodemailer');
const config = require('config');

const transporter = nodemailer.createTransport({
    auth: {
        user: config.get('mail.GMAIL_USER')
        , pass: config.get('mail.GMAIL_PASSWORD')
    }
    , service: 'MAILER_SERVICE_PROVIDER'
    , connectionTimeout: 8096
    , pool: true
    , host: 'mail.bookingtemps.com'
    , port: 587
    , secure: false
    , requireTLS: true
});

module.exports.mailer = transporter
