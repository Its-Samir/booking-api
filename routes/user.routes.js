const express = require('express');
const {
    register,
    login,
    passportAuth,
    updateUser,
    getUser,
    userDashboard,
    deleteUser
} = require('../controller/user.controller');
const passport = require('passport');
const { verifyToken } = require('../utils/verify-auth');
const { userRegisterValidator, userLoginValidator } = require('../validators/user.validator');
require('../passport/passport-auth'); // for passport auth

const router = express.Router();

router.post('/register', userRegisterValidator, register);

router.post('/login', userLoginValidator, login);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google'), passportAuth);

router.get('/user', getUser);

router.get('/user/dashboard', verifyToken, userDashboard);

router.put('/user/:userId', verifyToken, updateUser);

router.delete('/user/:userId', verifyToken, deleteUser);

module.exports = router;