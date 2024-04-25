const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const createError = require('../utils/create-error');

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.exists({ _id: id });

        if (user) {
            return done(null, user);
        }

        done(createError(404, 'User does not exists'), null);

    } catch (error) {
        done(createError(500, `User deserialization failed. ${error}`));
    }
});

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,

    }, async (_, _, profile, cb) => {
        try {
            const user = await User.exists({ email: profile._json.email });

            if (user) {
                return cb(null, user); // send the user to the req.user (configuration provided by passportjs) header for login
            }

            const userDetail = profile._json;

            const newUser = new User({
                email: userDetail.email,
                password: userDetail.sub, // here password not required but as our schema required password we are setting the sub provided by google
                username: userDetail.email?.split("@")[0],
            });

            await newUser.save();

            cb(null, newUser._id); // send the newUser._id to the req.user (configuration provided by passportjs) header after it is created and saved

        } catch (error) {
            cb(createError(500, 'Something went wrong while registering the user'));
        }
    })
);