const express = require('express');
const {
    createEvent,
    getEvents,
    bookEvent,
    makePayment,
    getEvent,
    review,
    editReview,
    likeEvent,
    cancelBooking,
    getTicket
} = require('../controller/event.controller');
const { verifyToken } = require('../utils/verify-auth');
const eventValidator = require('../validators/event.validator');

const router = express.Router();

/* create event */
router.post('/events', verifyToken, eventValidator, createEvent);

/* get all events */
router.get('/events', getEvents);

/* get single event */
router.get('/events/:eventId', getEvent);

/* book event */
router.post('/events/:eventId/bookings', verifyToken, bookEvent);

/* cancel booked event */
router.patch('/events/:eventId/bookings', verifyToken, cancelBooking);

/* make payment for event */
router.post('/events/:bookingId/checkout', verifyToken, makePayment);

/* get ticket */
router.get('/events/:eventId/tickets', verifyToken, getTicket);

/* review an event */
router.post('/events/:eventId/reviews', verifyToken, review);

/* edit review */
router.put('/events/:eventId/reviews', verifyToken, editReview);

/* like an event */
router.post('/events/:eventId/likes', verifyToken, likeEvent);

module.exports = router;