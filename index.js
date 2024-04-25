require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');

const authRouter = require('./routes/user.routes');
const eventRouter = require('./routes/event.routes');
const bookingRouter = require('./routes/booking.routes');
const notificationRouter = require('./routes/notification.routes');

(async function connect() {
    try {
        const db = await mongoose.connect(process.env.MONGO_URL);
        if (db) {
            console.log('DB Connected');

            app.listen(5000, () => {
                console.log('Running...');
            });
        }
    } catch (error) {
        console.log(error);
    }
})();

const app = express();
module.exports = app;

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// session required for passport.js
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', authRouter);
app.use('/api', eventRouter);
app.use('/api', bookingRouter);
app.use('/api', notificationRouter);

app.use((err, req, res, next) => {
    const errorMessage = err.message || 'Something went wrong.';
    const errorCode = err.statusCode || 500;
    res.status(errorCode).json({ errorMessage: errorMessage });
});