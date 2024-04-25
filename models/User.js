const mongoose = require("mongoose");
const { notificationSchema } = require("./Notification");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        default: 'user'
    },
    fullname: String,
    phone: String,
    address: String,
    city: String,
    country: String,
    payment_methods: [String],
    events: { type: [{ eventId: { type: mongoose.Schema.Types.ObjectId,  } }], ref: 'Event' },
    bookings: { type: [{ bookingId: { type: mongoose.Schema.Types.ObjectId } }], ref: 'Booking' },
    notifications: [notificationSchema],
    avatar: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;