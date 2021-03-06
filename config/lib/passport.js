const passport = require('passport');
const InstagramStrategy = require('passport-instagram').Strategy;
const LocalStrategy = require('passport-local')
    .Strategy;
const JwtStrategy = require('passport-jwt')
    .Strategy;
const ExtractJwt = require('passport-jwt')
    .ExtractJwt;
const FacebookStrategy = require('passport-facebook')
    .Strategy;
const TwitterStrategy = require('passport-twitter-token');
const GoogleStrategy = require('passport-google-oauth')
    .OAuth2Strategy;
const config = require('config');

const User = require('../../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

/**
 * Authenticate using JWT
 */
passport.use(new JwtStrategy({jwtFromRequest: ExtractJwt.fromAuthHeader(), secretOrKey: config.get('TOKEN_SECRET')}, (jwt_payload, done) => {
    User.findById(jwt_payload.sub, (err, user) => {
        if (err) {
            return done(err)
        }
        if (!user) {
            return done(null, false, {
                msg: `User not found`
            })
        } else {
            return done(null, user)
        }
    })
}))

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({
    usernameField: 'email'
}, (email, password, done) => {
    User.findOne({
        email: email.toLowerCase()
    }, (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, {
                msg: `Email ${email} not found.`
            });
        }
        user.comparePassword(password, (err, isMatch) => {
            if (err) {
                return done(err);
            }
            if (isMatch) {
                return done(null, user);
            }
            return done(null, false, {
                msg: 'Invalid email or password.'
            });
        });
    });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
    clientID: config.get('facebook.FACEBOOK_ID')
    , clientSecret: config.get('facebook.FACEBOOK_SECRET')
    , callbackURL: '/auth/facebook/callback'
    , profileFields: ['name', 'email', 'link', 'locale', 'timezone']
    , passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
    if (req.user) {
        User.findOne({
            facebook: profile.id
        }, (err, existingUser) => {
            if (err) {
                return done(err);
            }
            if (existingUser) {
                req.flash('errors', {
                    msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.'
                });
                done(err);
            } else {
                User.findById(req.user.id, (err, user) => {
                    if (err) {
                        return done(err);
                    }
                    user.facebook = profile.id;
                    user.tokens.push({
                        kind: 'facebook'
                        , accessToken
                    });
                    user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
                    // user.profile.picture = user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
                    user.save((err) => {
                        req.flash('info', {
                            msg: 'Facebook account has been linked.'
                        });
                        done(err, user);
                    });
                });
            }
        });
    } else {
        User.findOne({
            facebook: profile.id
        }, (err, existingUser) => {
            if (err) {
                return done(err);
            }
            if (existingUser) {
                return done(null, existingUser);
            }
            User.findOne({
                email: profile._json.email
            }, (err, existingEmailUser) => {
                if (err) {
                    return done(err);
                }
                if (existingEmailUser) {
                    req.flash('errors', {
                        msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.'
                    });
                    done(err);
                } else {
                    const user = new User();
                    user.email = profile._json.email;
                    user.facebook = profile.id;
                    user.tokens.push({
                        kind: 'facebook'
                        , accessToken
                    });
                    user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
                    // user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
                    user.save((err) => {
                        done(err, user);
                    });
                }
            });
        });
    }
}));

/**
 * Sign in with Twitter.
 */
passport.use(new TwitterStrategy({
    consumerKey: config.get('twitter.TWITTER_KEY')
    , consumerSecret: config.get('twitter.TWITTER_SECRET')
    , callbackURL: '/auth/twitter/callback'
    , passReqToCallback: true
}, (req, accessToken, tokenSecret, profile, done) => {
    if (req.user) {
        User.findOne({
            twitter: profile.id
        }, (err, existingUser) => {
            if (err) {
                return done(err);
            }
            if (existingUser) {
                req.flash('errors', {
                    msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.'
                });
                done(err);
            } else {
                User.findById(req.user.id, (err, user) => {
                    if (err) {
                        return done(err);
                    }
                    user.twitter = profile.id;
                    user.tokens.push({
                        kind: 'twitter'
                        , accessToken
                        , tokenSecret
                    });
                    user.profile.name = user.profile.name || profile.displayName;
                    // user.profile.picture = user.profile.picture || profile._json.profile_image_url_https;
                    user.save((err) => {
                        if (err) {
                            return done(err);
                        }
                        req.flash('info', {
                            msg: 'Twitter account has been linked.'
                        });
                        done(err, user);
                    });
                });
            }
        });
    } else {
        User.findOne({
            twitter: profile.id
        }, (err, existingUser) => {
            if (err) {
                return done(err);
            }
            if (existingUser) {
                return done(null, existingUser);
            }
            const user = new User();
            // Twitter will not provide an email address.  Period.
            // But a person’s twitter username is guaranteed to be unique
            // so we can "fake" a twitter email address as follows:
            user.email = `${profile.username}@twitter.com`;
            user.twitter = profile.id;
            user.tokens.push({
                kind: 'twitter'
                , accessToken
                , tokenSecret
            });
            user.profile.name = profile.displayName;
            // user.profile.picture = profile._json.profile_image_url_https;
            user.save((err) => {
                done(err, user);
            });
        });
    }
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
    clientID: config.get('google.GOOGLE_ID')
    , clientSecret: config.get('google.GOOGLE_SECRET')
    , callbackURL: '/auth/google/callback'
    , passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
    if (req.user) {
        User.findOne({
            google: profile.id
        }, (err, existingUser) => {
            if (err) {
                return done(err);
            }
            if (existingUser) {
                req.flash('errors', {
                    msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.'
                });
                done(err);
            } else {
                User.findById(req.user.id, (err, user) => {
                    if (err) {
                        return done(err);
                    }
                    user.google = profile.id;
                    user.tokens.push({
                        kind: 'google'
                        , accessToken
                    });
                    user.profile.name = user.profile.name || profile.displayName;
                    // user.profile.picture = user.profile.picture || profile._json.image.url;
                    user.save((err) => {
                        req.flash('info', {
                            msg: 'Google account has been linked.'
                        });
                        done(err, user);
                    });
                });
            }
        });
    } else {
        User.findOne({
            google: profile.id
        }, (err, existingUser) => {
            if (err) {
                return done(err);
            }
            if (existingUser) {
                return done(null, existingUser);
            }
            User.findOne({
                email: profile.emails[0].value
            }, (err, existingEmailUser) => {
                if (err) {
                    return done(err);
                }
                if (existingEmailUser) {
                    req.flash('errors', {
                        msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.'
                    });
                    done(err);
                } else {
                    const user = new User();
                    user.email = profile.emails[0].value;
                    user.google = profile.id;
                    user.tokens.push({
                        kind: 'google'
                        , accessToken
                    });
                    user.profile.name = profile.displayName;
                    // user.profile.picture = profile._json.image.url;
                    user.save((err) => {
                        done(err, user);
                    });
                }
            });
        });
    }
}));

/**
 * Sign in with Instagram.
 */
passport.use(new InstagramStrategy({
    clientID: config.get('instagram.INSTAGRAM_ID')
    , clientSecret: config.get('instagram.INSTAGRAM_SECRET')
    , callbackURL: '/auth/instagram/callback'
    , passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
    if (req.user) {
        User.findOne({
            instagram: profile.id
        }, (err, existingUser) => {
            if (err) {
                return done(err);
            }
            if (existingUser) {
                req.flash('errors', {
                    msg: 'There is already an Instagram account that belongs to you. Sign in with that account or delete it, then link it with your current account.'
                });
                done(err);
            } else {
                User.findById(req.user.id, (err, user) => {
                    if (err) {
                        return done(err);
                    }
                    user.instagram = profile.id;
                    user.tokens.push({
                        kind: 'instagram'
                        , accessToken
                    });
                    user.profile.name = user.profile.name || profile.displayName;
                    // user.profile.picture = user.profile.picture || profile._json.data.profile_picture;
                    user.save((err) => {
                        req.flash('info', {
                            msg: 'Instagram account has been linked.'
                        });
                        done(err, user);
                    });
                });
            }
        });
    } else {
        User.findOne({
            instagram: profile.id
        }, (err, existingUser) => {
            if (err) {
                return done(err);
            }
            if (existingUser) {
                return done(null, existingUser);
            }
            const user = new User();
            user.instagram = profile.id;
            user.tokens.push({
                kind: 'instagram'
                , accessToken
            });
            user.profile.name = profile.displayName;
            // Similar to Twitter API, assigns a temporary e-mail address
            // to get on with the registration process. It can be changed later
            // to a valid e-mail address in Profile Management.
            user.email = `${profile.username}@instagram.com`;
            // user.profile.picture = profile._json.data.profile_picture;
            user.save((err) => {
                done(err, user);
            });
        });
    }
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
    if (passport.authenticate('jwt', { session: false} )) {
        return next(req.user);
    }
    res.status(401);
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
    const provider = req.path.split('/')
        .slice(-1)[0];
    const token = req.user.tokens.find(token => token.kind === provider);
    if (token) {
        next();
    } else {
        res.redirect(`/auth/${provider}`);
    }
};
