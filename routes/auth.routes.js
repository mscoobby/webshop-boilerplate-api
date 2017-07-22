const express = require('express');
const router = express.Router();
const passport = require('passport')

router.get('/instagram', passport.authenticate('instagram'));
router.get('/instagram/callback', passport.authenticate('instagram', {
    failureRedirect: '/user/login'
}), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
router.get('/facebook', passport.authenticate('facebook', {
    scope: ['email', 'public_profile']
}));
router.get('/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/user/login'
}), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
router.get('/google', passport.authenticate('google', {
    scope: 'profile email'
}));
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/user/login'
}), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
router.get('/twitter', passport.authenticate('twitter'));
router.get('/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/user/login'
}), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});

module.exports = router;
