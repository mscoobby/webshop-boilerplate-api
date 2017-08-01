const express = require('express');
const router = express.Router();
const passport = require('passport')

router.post('/instagram', passport.authenticate('instagram'));
router.get('/instagram/callback', passport.authenticate('instagram', {
    failureRedirect: '/login'
}), (req, res, next) => {
    // res.redirect(req.session.returnTo || '/');
    next()
});
router.post('/facebook', passport.authenticate('facebook', {
    scope: ['email', 'public_profile']
}));

router.get('/facebook/callback', passport.authenticate('facebook'), (req, res, next) => {
    res.redirect('/');
});
router.post('/google', passport.authenticate('google', {
    scope: 'profile email'
}));
router.get('/google/callback', passport.authenticate('google', {
    successRedirect: '/login'
    , failureRedirect: '/user/login'
}), (req, res, next) => {
    console.log('hello')
    // res.redirect('/login');
});
router.post('/twitter', passport.authenticate('twitter-token'));
router.get('/twitter/callback', passport.authenticate('twitter-token', {
    failureRedirect: '/login'
}), (req, res) => {
    res.redirect('/');
});

module.exports = router;
