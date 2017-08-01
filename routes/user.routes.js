const express = require('express');
const router = express.Router();
const passport = require('passport');

const userController = require('../controllers/user')
const passportConfig = require('../config/lib/passport');

router.get('/', passport.authenticate('jwt', { session: false} ), userController.getUser);

router.post('/login', userController.postLogin);
router.get('/logout', userController.logout);
// router.post('/forgot', userController.postForgot);
// router.get('/reset/:token', userController.getReset);
// router.post('/reset/:token', userController.postReset);
router.post('/signup', userController.postSignup);
router.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
router.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
// router.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
router.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

module.exports = router;
