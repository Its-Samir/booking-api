const User = require("../models/User");
const createError = require('../utils/create-error');
const bcrypt = require('bcryptjs');
const createResponse = require("../utils/create-response");
const jwt = require('jsonwebtoken');
const { validationResult } = require("express-validator");
const createNotification = require("../utils/create-notification");

exports.register = async (req, res, next) => {
    try {
        const { username, password, email } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) return next(createError(422, errors.array()[0].msg.toString()));

        const existsUser = await User.exists({ $or: [{ username }, { email }] });

        if (existsUser) {
            return next(createError(409, 'User with this email or username already exists'));
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        createResponse(res, 201, { message: 'Signup successfull' });

    } catch (error) {
        next(error);
    }
}

exports.login = async (req, res, next) => {
    try {
        const { password, email } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) return next(createError(422, errors.array()[0].msg.toString()));

        const user = await User.findOne({ email }).select('password role');

        if (!user) {
            return next(createError(404, 'User with this email not found'));
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password);

        if (!isCorrectPassword) {
            return next(createError(400, 'Wrong credentials'));
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_TOKEN, { expiresIn: '1h' });

        createResponse(res, 200, { token: token, userId: user._id, role: user.role, message: 'Login successfull' });

    } catch (error) {
        next(error);
    }
}

exports.passportAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user?._id).select('role');

        if (!user) {
            return next(createError(404, 'User not found'));
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_TOKEN, { expiresIn: '1h' });

        createResponse(res, 200, { token: token, userId: user._id, role: user.role, message: 'Authentication successfull' });

    } catch (error) {
        next(error);
    }
}

exports.userDashboard = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return next(createError(404, 'User not found'));
        }

        createResponse(res, 200, { user });

    } catch (error) {
        next(error);
    }
}

exports.getUser = async (req, res, next) => {
    try {
        const username = req.query.username;

        const user = await User.findOne({ username }).select('-password -address -phone -payment_methods -events -bookings -notifications');

        if (!user) {
            return next(createError(404, 'User does not exists'));
        }

        createResponse(res, 200, { user });

    } catch (error) {
        next(error);
    }
}

exports.updateUser = async (req, res, next) => {
    try {
        if (req.params.userId.toString() === req.userId.toString()) {

            const { username, city } = req.body;

            const user = await User.findByIdAndUpdate(req.userId, { $set: { username, city } }).select('_id');

            if (!user) {
                return next(createError(404, 'User does not exists'));
            }

            await createNotification(user._id, `You have updated your details`);
            return createResponse(res, 200, { message: 'User updated' });
        }

        next(createError(403, 'Couldn\'t update user'));

    } catch (error) {
        next(error);
    }
}

exports.deleteUser = async (req, res, next) => {
    try {
        if (req.params.userId.toString() === req.userId.toString()) {
            const respose = await User.findByIdAndDelete(req.params.userId);

            if (!respose) {
                return next(createError(404, 'User does not exists'));
            }

            return createResponse(res, 200, { message: 'User deleted' });
        }

        next(createError(403, 'Couldn\'t delete user'));

    } catch (error) {
        next(error);
    }
}