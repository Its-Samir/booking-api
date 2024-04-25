const express = require('express');
const { getBookings, deleteBooking, getBooking } = require('../controller/booking.controller');
const { verifyToken } = require('../utils/verify-auth');

const router = express.Router();

router.get('/bookings', verifyToken, getBookings);

router.get('/bookings/:bookingId', verifyToken, getBooking);

router.delete('/bookings/:bookingId', verifyToken, deleteBooking);

module.exports = router;