const { mailer } = require('../models/Mailer.js')

/**
 * GET /contact
 * Contact form page.
 */
exports.getContact = (req, res, next) => {
    res.render('contact', {
        title: 'Contact'
    });
};

/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
exports.postContact = (req, res) => {
    req.assert('name', 'Name cannot be blank')
        .notEmpty();
    req.assert('email', 'Email is not valid')
        .isEmail();
    req.assert('message', 'Message cannot be blank')
        .notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/contact');
    }

    const mailOptions = {
        to: 'georgi@bookingtemps.com'
        , from: `georgi@bookingtemps.com`
        , subject: 'Contact Form | ${req.body.email}'
        , text: `${req.body.name} <${req.body.email}>\n\n ${req.body.message}`
    };

    mailer.sendMail(mailOptions, (err) => {
        if (err) {
            req.flash('errors', {
                msg: err.message
            });
            return res.redirect('/contact');
        }
        req.flash('success', {
            msg: 'Email has been sent successfully!'
        });
        res.redirect('/contact');
    });
};
