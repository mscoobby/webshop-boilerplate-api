const Promise = require('bluebird');
const crypto = Promise.promisifyAll(require('crypto'));
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../models/User');
const mailer = require('../models/Mailer.js')
    .mailer;

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
    req.assert('email', 'Email is not valid')
        .isEmail();
    req.assert('password', 'Password cannot be blank')
        .notEmpty();
    req.sanitize('email')
        .normalizeEmail({
            gmail_remove_dots: false
        });

    const errors = req.validationErrors();

    if (errors) {
        return res.status(400)
            .json(errors)
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401)
                .json(info)
        }
        if (err) {
            return next(err);
        }

        let token = jwt.sign({
            sub: user._id
        }, config.get('TOKEN_SECRET'), {
            expiresIn: 1000
        })
        req.logIn(user, (err) => {
            if (err) return next(err)
            delete user.password;
            return res.json({
                user
                , token
            })
        })
    })(req, res, next);
};

/**
 * GET /
 * Get user from auth token
 */
exports.getUser = (req, res, next) => {
    let uid = req.user._id;

    User.findById(uid)
        .then(user => res.json(user.publicProfile()))
        .catch(next)
}

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
    req.logout();
    res.redirect('/');
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
    req.assert('email', 'Email is not valid')
        .isEmail();
    req.assert('password', 'Password must be at least 4 characters long')
        .len(4);
    req.assert('confirmPassword', 'Passwords do not match')
        .equals(req.body.password);
    req.sanitize('email')
        .normalizeEmail({
            gmail_remove_dots: false
        });

    const errors = req.validationErrors();

    if (errors) {
        return res.status(400)
            .json(errors);
    }

    const user = new User({
        email: req.body.email
        , password: req.body.password
    });

    User.findOne({
        email: req.body.email
    }, (err, existingUser) => {
        if (err) {
            return next(err);
        }
        if (existingUser) {
            return res.status(400)
                .json({
                    message: 'Account with that email address already exists.'
                });
        }
        user.save((err) => {
            if (err) {
                return next(err);
            }
            return res.json({
                message: 'Registration is successfull'
            });
        });
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
    req.assert('email', 'Please enter a valid email address.')
        .isEmail();
    req.sanitize('email')
        .normalizeEmail({
            gmail_remove_dots: false
        });

    const errors = req.validationErrors();

    if (errors) {
        return res.status(400)
            .json(errors);
    }

    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user.email = req.body.email || '';
        user.profile.name = req.body.name || '';

        user.save((err) => {
            if (err) {
                if (err.code === 11000) {
                    return res.status(400)
                        .json({
                            message: 'The email address you have entered is already associated with an account.'
                        });
                }
                return next(err);
            }
            return res.json({
                message: 'Profile information has been updated.'
            });
        });
    });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long')
        .len(4);
    req.assert('confirmPassword', 'Passwords do not match')
        .equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        return res.status(400)
            .json(errors);
    }

    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user.password = req.body.password;
        user.save((err) => {
            if (err) {
                return next(err);
            }
            return res.json({
                message: 'Password has been changed.'
            });
        });
    });
};

/**
 * POST /account/delete
 * Delete user account.
 */
// exports.postDeleteAccount = (req, res, next) => {
//     User.remove({
//         _id: req.user.id
//     }, (err) => {
//         if (err) {
//             return next(err);
//         }
//         req.logout();
//         req.flash('info', {
//             msg: 'Your account has been deleted.'
//         });
//         res.redirect('/');
//     });
// };

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
    const provider = req.params.provider;
    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user[provider] = undefined;
        user.tokens = user.tokens.filter(token => token.kind !== provider);
        user.save((err) => {
            if (err) {
                return next(err);
            }
            res.json({
                message: `${provider} account has been unlinked.`
            });
        });
    });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
// exports.getReset = (req, res, next) => {
//     if (req.isAuthenticated()) {
//         return res.redirect('/');
//     }
//     User
//         .findOne({
//             passwordResetToken: req.params.token
//         })
//         .where('passwordResetExpires')
//         .gt(Date.now())
//         .exec((err, user) => {
//             if (err) {
//                 return next(err);
//             }
//             if (!user) {
//                 req.flash('errors', {
//                     msg: 'Password reset token is invalid or has expired.'
//                 });
//                 return res.redirect('/user/forgot');
//             }
//             res.render('account/reset', {
//                 title: 'Password Reset'
//             });
//         });
// };

/**
 * POST /reset/:token
 * Process the reset password request.
 */
// exports.postReset = (req, res, next) => {
//     req.assert('password', 'Password must be at least 4 characters long.')
//         .len(4);
//     req.assert('confirm', 'Passwords must match.')
//         .equals(req.body.password);
//
//     const errors = req.validationErrors();
//
//     if (errors) {
//         req.flash('errors', errors);
//         return res.redirect('back');
//     }
//
//     const resetPassword = () =>
//         User
//         .findOne({
//             passwordResetToken: req.params.token
//         })
//         .where('passwordResetExpires')
//         .gt(Date.now())
//         .then((user) => {
//             if (!user) {
//                 req.flash('errors', {
//                     msg: 'Password reset token is invalid or has expired.'
//                 });
//                 return res.redirect('back');
//             }
//             user.password = req.body.password;
//             user.passwordResetToken = undefined;
//             user.passwordResetExpires = undefined;
//             return user.save()
//                 .then(() => new Promise((resolve, reject) => {
//                     req.logIn(user, (err) => {
//                         if (err) {
//                             return reject(err);
//                         }
//                         resolve(user);
//                     });
//                 }));
//         });
//
//     const sendResetPasswordEmail = (user) => {
//         if (!user) {
//             return;
//         }
//         const mailOptions = {
//             to: user.email
//             , from: 'georgi@bookingtemps.com'
//             , subject: 'Your webshop-boilerplate password has been changed'
//             , text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
//         };
//         return mailer.sendMail(mailOptions)
//             .then(() => {
//                 req.flash('success', {
//                     msg: 'Success! Your password has been changed.'
//                 });
//             });
//     };
//
//     resetPassword()
//         .then(sendResetPasswordEmail)
//         .then(() => {
//             if (!res.finished) res.redirect('/');
//         })
//         .catch(err => next(err));
// };

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
// exports.postForgot = (req, res, next) => {
//     req.assert('email', 'Please enter a valid email address.')
//         .isEmail();
//     req.sanitize('email')
//         .normalizeEmail({
//             gmail_remove_dots: false
//         });
//
//     const errors = req.validationErrors();
//
//     if (errors) {
//         req.flash('errors', errors);
//         return res.redirect('/user/forgot');
//     }
//
//     const createRandomToken = crypto
//         .randomBytesAsync(16)
//         .then(buf => buf.toString('hex'));
//
//     const setRandomToken = token =>
//         User
//         .findOne({
//             email: req.body.email
//         })
//         .then((user) => {
//             if (!user) {
//                 req.flash('errors', {
//                     msg: 'Account with that email address does not exist.'
//                 });
//             } else {
//                 user.passwordResetToken = token;
//                 user.passwordResetExpires = Date.now() + 3600000; // 1 hour
//                 user = user.save();
//             }
//             return user;
//         });
//
//     const sendForgotPasswordEmail = (user) => {
//         if (!user) {
//             return;
//         }
//         const token = user.passwordResetToken;
//         const mailOptions = {
//             to: user.email
//             , from: 'georgi@bookingtemps.com'
//             , subject: 'Reset your password on Hackathon Starter'
//             , text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
//         Please click on the following link, or paste this into your browser to complete the process:\n\n
//         http://${req.headers.host}/reset/${token}\n\n
//         If you did not request this, please ignore this email and your password will remain unchanged.\n`
//         };
//         return mailer.sendMail(mailOptions)
//             .then(() => {
//                 req.flash('info', {
//                     msg: `An e-mail has been sent to ${user.email} with further instructions.`
//                 });
//             });
//     };
//
//     createRandomToken
//         .then(setRandomToken)
//         .then(sendForgotPasswordEmail)
//         .then(() => res.redirect('/user/forgot'))
//         .catch(next);
// };
