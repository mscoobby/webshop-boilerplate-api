const Promise = require('bluebird');

const config = require('config')
const Twit = require('twit');
const stripe = require('stripe')(config.get('stripe.STRIPE_SKEY'));
const paypal = require('paypal-rest-sdk');

/**
 * GET /api
 * List of API examples.
 */
exports.getApi = (req, res, next) => {
    res.render('api/index', {
        title: 'API Examples'
    });
};

/**
 * GET /api/error
 * Throw an error
 */
 exports.getError = (req, res, next) => {
   throw new Error('There you go an Error')
 }

/**
 * GET /api/twitter
 * Twitter API example.
 */
exports.getTwitter = (req, res, next) => {
    const token = req.user.tokens.find(token => token.kind === 'twitter');
    const T = new Twit({
        consumer_key: config.get('twitter.TWITTER_KEY')
        , consumer_secret: config.get('twitter.TWITTER_SECRET')
        , access_token: token.accessToken
        , access_token_secret: token.tokenSecret
    });
    T.get('search/tweets', {
        q: 'nodejs since:2013-01-01'
        , geocode: '40.71448,-74.00598,5mi'
        , count: 10
    }, (err, reply) => {
        if (err) {
            return next(err);
        }
        res.render('api/twitter', {
            title: 'Twitter API'
            , tweets: reply.statuses
        });
    });
};

/**
 * POST /api/twitter
 * Post a tweet.
 */
exports.postTwitter = (req, res, next) => {
    req.assert('tweet', 'Tweet cannot be empty')
        .notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/api/twitter');
    }

    const token = req.user.tokens.find(token => token.kind === 'twitter');
    const T = new Twit({
        consumer_key: config.get('twitter.TWITTER_KEY')
        , consumer_secret: config.get('twitter.TWITTER_SECRET')
        , access_token: token.accessToken
        , access_token_secret: token.tokenSecret
    });
    T.post('statuses/update', {
        status: req.body.tweet
    }, (err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', {
            msg: 'Your tweet has been posted.'
        });
        res.redirect('/api/twitter');
    });
};

/**
 * GET /api/stripe
 * Stripe API example.
 */
exports.getStripe = (req, res) => {
    res.render('api/stripe', {
        title: 'Stripe API'
        , publishableKey: config.get('stripe.STRIPE_PKEY')
    });
};

/**
 * POST /api/stripe
 * Make a payment.
 */
exports.postStripe = (req, res) => {
    const stripeToken = req.body.stripeToken;
    const stripeEmail = req.body.stripeEmail;
    stripe.charges.create({
        amount: 395
        , currency: 'usd'
        , source: stripeToken
        , description: stripeEmail
    }, (err) => {
        if (err && err.type === 'StripeCardError') {
            req.flash('errors', {
                msg: 'Your card has been declined.'
            });
            return res.redirect('/api/stripe');
        }
        req.flash('success', {
            msg: 'Your card has been successfully charged.'
        });
        res.redirect('/api/stripe');
    });
};

/**
 * GET /api/paypal
 * PayPal SDK example.
 */
exports.getPayPal = (req, res, next) => {
    paypal.configure({
        mode: 'sandbox'
        , client_id: config.get('paypal.PAYPAL_ID')
        , client_secret: config.get('paypal.PAYPAL_SECRET')
    });

    const paymentDetails = {
        intent: 'sale'
        , payer: {
            payment_method: 'paypal'
        }
        , redirect_urls: {
            return_url: config.get('paypal.PAYPAL_RETURN_URL')
            , cancel_url: config.get('paypal.PAYPAL_CANCEL_URL')
        }
        , transactions: [{
            description: 'Hackathon Starter'
            , amount: {
                currency: 'USD'
                , total: '1.99'
            }
        }]
    };

    paypal.payment.create(paymentDetails, (err, payment) => {
        if (err) {
            return next(err);
        }
        req.session.paymentId = payment.id;
        const links = payment.links;
        for (let i = 0; i < links.length; i++) {
            if (links[i].rel === 'approval_url') {
                res.render('api/paypal', {
                    approvalUrl: links[i].href
                });
            }
        }
    });
};

/**
 * GET /api/paypal/success
 * PayPal SDK example.
 */
exports.getPayPalSuccess = (req, res) => {
    const paymentId = req.session.paymentId;
    const paymentDetails = {
        payer_id: req.query.PayerID
    };
    paypal.payment.execute(paymentId, paymentDetails, (err) => {
        res.render('api/paypal', {
            result: true
            , success: !err
        });
    });
};

/**
 * GET /api/paypal/cancel
 * PayPal SDK example.
 */
exports.getPayPalCancel = (req, res) => {
    req.session.paymentId = null;
    res.render('api/paypal', {
        result: true
        , canceled: true
    });
};

exports.getGoogleMaps = (req, res) => {
    res.render('api/google-maps', {
        title: 'Google Maps API'
        , mapKey: config.get('google.MAP_KEY')
    });
};
