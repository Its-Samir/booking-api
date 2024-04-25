const { body } = require('express-validator');

// fields having only one error message
const usernameErrorMessage = 'username field should not be empty';
const passwordErrorMessage = 'password should be more than 8 character long';
const emailErrorMessage = 'input type must be an email';

const userRegisterValidator = [
    body('username').trim().notEmpty().withMessage(usernameErrorMessage),
    body('password').notEmpty().isLength({ min: 8 }).withMessage(passwordErrorMessage),
    body('email').trim().isEmail().withMessage(emailErrorMessage)
];

const userLoginValidator = [
    body('password').notEmpty().isLength({ min: 8 }).withMessage(passwordErrorMessage),
    body('email').trim().isEmail().withMessage(emailErrorMessage)
];

const userUpdateValidator = [
    body('username').trim().notEmpty().withMessage(usernameErrorMessage),
    body('city').trim().notEmpty().withMessage('city field should not be empty')
];

const credentialsUpdateValidator = [
    body('email').trim().isEmail().withMessage(emailErrorMessage),
    body('password').notEmpty().isLength({ min: 8 }).withMessage(passwordErrorMessage)
];

module.exports = { userRegisterValidator, userLoginValidator, userUpdateValidator, credentialsUpdateValidator };