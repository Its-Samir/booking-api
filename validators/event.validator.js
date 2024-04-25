const { body } = require('express-validator');

const eventValidator = [
    body('title').notEmpty().withMessage('title field is required'),
    body('description').notEmpty().isLength({ min: 3 }).withMessage('description length must be more than 3 character long'),
    body('location').trim().notEmpty().withMessage('location must be valid'),
    body('max_people').trim().notEmpty().withMessage('max_people field is required').isNumeric().withMessage('max_people value type must be a number'),
    body('category').trim().notEmpty().withMessage('category field is required'),
    body('ticket_price').trim().notEmpty().withMessage('ticket_price field is required').isNumeric().withMessage('ticket_price value type must be a number'),
    body('start_date').trim().notEmpty().withMessage('start_date field is required').isString().withMessage('start_date value type must be a string'),
    body('end_date').trim().notEmpty().withMessage('end_date field is required').isString().withMessage('end_date value type must be a string'),
    body('time').trim().notEmpty().withMessage('time field is required').isString().withMessage('time value type must be a string'),
];

module.exports = eventValidator;