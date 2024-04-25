const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    time: { type: String, required: true },
    max_people: { type: Number, required: true },
    ticket_price: { type: Number, required: true },
    category: { type: String, required: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    image_url: String,
    tags: [String], //['music', 'concert', 'entertainment', 'workshop'] and for Movie ["Action", "Thriller", "Adventure"]
    artists: [String],
    reviews: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rating: Number,
            comment: String,
            time: Date
        }
    ],
    rating: { type: Number, default: 0 },
    likes: [mongoose.Schema.Types.ObjectId],
    status: { type: String, default: 'upcoming' }, // whether over, upcoming, going-on, postponed
    booked_users: { type: [{ userId: mongoose.Schema.Types.ObjectId }], ref: 'User' },
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;