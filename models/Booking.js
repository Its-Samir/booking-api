const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    booking_date: Date,
    quantity: Number,
    total_amount: Number,
    status: { type: String, default: 'pending' },
    payment_status: { type: String, default: 'payment_required' }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;