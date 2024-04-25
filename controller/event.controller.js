const Booking = require("../models/Booking");
const Event = require("../models/Event");
const User = require("../models/User");
const createError = require("../utils/createError");
const createNotification = require('../utils/createNotification');
const createResponse = require("../utils/createResponse");
const { validationResult } = require("express-validator");

exports.createEvent = async (req, res, next) => {
    try {
        const { title, description, address, location, max_people, category, ticket_price, artists, tags, start_date, end_date, time } = req.body;

        if (new Date(start_date) < new Date() || new Date(end_date) < new Date()) {
            return next(createError(422, 'start date or end date is older'));
        }

        const errors = validationResult(req);

        if (!errors.isEmpty()) return next(createError(422, errors.array()[0].msg.toString()));

        const newEvent = new Event({
            title,
            description,
            address,
            location,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            time,
            max_people,
            category,
            ticket_price,
            organizerId: req.userId
        });

        artists && artists.forEach(artist => newEvent.artists.push(artist));

        tags && tags.forEach(tag => newEvent.tags.push(tag));

        await newEvent.save();

        await User.findByIdAndUpdate(req.userId, {
            $push: { events: { eventId: newEvent._id } }
        }, { projection: '_id' });

        createResponse(res, 201, { message: 'Event creation successfull' });

    } catch (error) {
        next(error);
    }
}

exports.getEvents = async (req, res, next) => {
    try {
        const { userId, location, maxPeople, page, category, artists, minPrice, maxPrice } = req.query;
        let currPage = page || 1;
        let limit = 5;

        const query = {};
        const countDocQuery = { start_date: { $gt: new Date() } };

        if (userId) {
            const user = await User.findById(userId).select('city');

            /* by default location will be the city of current user if user is true and location is null */
            if (user && !location) {
                query.location = user.city;
            }
        }

        if (req.body.titleSearch) {
            query.title = {
                $regex: req.body.titleSearch.toString(),
                $options: 'i'
            };
            countDocQuery.title = { ...query.title };
        }

        /* overiding the location if location is true (means actually filterd by location query from frontend) */
        if (location) {
            query.location = location;
        }

        if (maxPeople) {
            query.max_people = { $lt: +maxPeople };
        }

        if (minPrice) {
            query.ticket_price = { $gt: +minPrice, ...query.ticket_price };
        }

        if (maxPrice) {
            query.ticket_price = { ...query.ticket_price, $lt: +maxPrice };
        }

        if (category) {
            query.category = category;
        }

        const eventCount = await Event.countDocuments({ ...countDocQuery });

        const hasNextPage = (eventCount / page) > limit; /* limit is 5 (another approach maybe (eventCount - (page * limit) >= 0))*/
        const hasPrevPage = page > 1;

        const event = await Event.find({
            $and: [
                { ...query },
                { start_date: { $gt: new Date() } }
            ]
        }).select('title description max_people ticket_price tags rating image_url').skip((currPage * limit) - limit).limit(limit); /* also (page - 1) * limit */

        createResponse(res, 200, { event, hasNextPage, hasPrevPage });

    } catch (error) {
        next(error);
    }
}

exports.getEvent = async (req, res, next) => {
    const { eventId } = req.params;
    let event;

    /* get specified fields, otheriwse all fields */
    if (req.query.fields) {
        event = await Event.findById(eventId).select(req.query.fields.split(','));
    } else {
        event = await Event.findById(eventId).select('-createdAt -updatedAt');
    }

    if (!event) {
        return next(createError(404, 'Event does not exists'));
    }

    let existedUserId;

    if (req.body.userId && event.booked_users) {
        existedUserId = event.booked_users.some(bookedUser => bookedUser.userId.toString() === req.body.userId.toString());
    }

    createResponse(res, 200, { event, isBooked: existedUserId ? true : false });
}

exports.bookEvent = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const { eventId } = req.params;
        const event = await Event.findById(eventId).select('title ticket_price booked_users');

        if (!event) {
            return next(createError(404, 'Event does not exists'));
        }

        const user = await User.findById(req.userId).select('bookings');

        if (!user) {
            return next(createError(404, 'User does not exists'));
        }

        const existedUserId = event.booked_users.some(user => user.userId.toString() === req.userId.toString());

        if (existedUserId) {
            return next(createError(403, 'User has already booked this Event'));
        }

        const existedBooking = await Booking.findOne({
            $and: [{ userId: req.userId }, { eventId }, { status: 'pending' }]
        }).select('status');

        if (existedBooking) {
            return next(createError(403, 'User already has a booking pending for this Event'));
        }

        const booking = new Booking({
            userId: user._id,
            eventId: event._id,
            booking_date: new Date(),
            quantity: quantity,
            total_amount: event.ticket_price * quantity
        });

        await booking.save();

        user.bookings.push({ bookingId: booking._id });
        await user.save();

        await createNotification(user._id, `Event (Title: ${event.title}) has been booked by you.`);

        createResponse(res, 200, { message: 'Event booked successfully', bookingId: booking._id });

    } catch (error) {
        next(error);
    }
}

exports.cancelBooking = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const booking = await Booking.findOne({
            $and: [{ eventId }, { userId: req.userId }]
        }).select('eventId userId payment_status');

        if (!booking ||
            booking.payment_status === 'refunded' ||
            booking.payment_status === ''
        ) {
            return next(createError(!booking ? 404 : 403, `${!booking ? 'Booking does not exists' : 'Booking was already cancelled'}`));
        }

        const event = await Event.findOne({ _id: booking.eventId }).select('title');

        if (!event) {
            return next(createError(404, 'Event does not exists'));
        }

        if (booking.payment_status === 'paid') {
            await Event.updateOne({ _id: event._id }, {
                $pull: { booked_users: req.userId }
            });
        }

        await Booking.updateOne({ _id: booking._id }, {
            $set: {
                status: 'cancelled',
                payment_status: booking.payment_status === 'paid' ?
                    'refunded' :
                    ''
            }
        });

        await createNotification(booking.userId, `Event (Title: ${event.title}) has been cancelled by you.`);

        createResponse(res, 200, { message: 'Booking cancelled' });

    } catch (error) {
        next(error);
    }
}

// not using stripe yet (simulating payment process)
exports.makePayment = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId).select('userId eventId payment_status');

        if (!booking) {
            return next(createError(404, 'Booking does not exists'));
        }

        if (booking.payment_status === 'paid' ||
            booking.payment_status === 'refunded' ||
            booking.payment_status === ''
        ) {
            return next(createError(403, `${booking.payment_status === 'paid' ?
                'Payment has already completed' :
                'Booking was cancelled'}`
            ));
        }

        const event = await Event.findByIdAndUpdate(booking.eventId, {
            $push: { booked_users: { userId: booking.userId } }
        }).select('title');

        if (!event) {
            return next(createError(404, 'Event does not exists'));
        }

        await booking.updateOne({ $set: { status: 'confirmed', payment_status: 'paid' } });
        await createNotification(booking.userId, `Payment for Event (Title: ${event.title}) has been completed.`);

        createResponse(res, 200, { message: 'Payment successful' });

    } catch (error) {
        next(error);
    }
}

exports.getTicket = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const booking = await Booking.findOne({
            $and: [{ eventId }, { userId: req.userId }]
        }).select('eventId total_amount status');

        if (!booking) {
            return next(createError(404, 'Booking does not exists'));
        }

        const event = await Event.findById(booking.eventId).select('title start_date time location image_url');

        if (!event) {
            return next(createError(404, 'Event does not exists'));
        }

        const ticketDetails = {
            title: event.title,
            start_date: event.start_date,
            time: event.time,
            location: event.location,
            imageUrl: event.image_url,
            total_amount: booking.total_amount,
            status: booking.status
        };

        createResponse(res, 200, { ticketDetails });

    } catch (error) {
        next(error);
    }
}

exports.review = async (req, res, next) => {
    try {
        const { comment, rating } = req.body;

        if (!rating) return next(createError(422, 'Field(s) is empty.'));

        const event = await Event.findById(req.params.eventId).select('reviews rating');

        if (!event) {
            return next(createError(404, 'Event does not exists'));
        }

        const existedUserReview = event.reviews.some(review => review.userId.toString() === req.userId.toString());

        if (existedUserReview) return next(createError(403, 'You have already rated this Event'));

        const review = {
            userId: req.userId,
            comment: comment,
            rating: +rating,
            time: new Date()
        }

        event.reviews.push(review);
        await event.save();

        let totalRating = 0;
        const totalUser = event.reviews.length;
        totalUser > 0 && event.reviews.forEach(review => totalRating += review.rating);

        event.rating = (totalRating / totalUser);
        await event.save();

        createResponse(res, 200, { message: 'Review added' });

    } catch (error) {
        next(error);
    }
}

exports.editReview = async (req, res, next) => {
    try {
        const { comment, rating } = req.body;

        if (!rating) return next(createError(422, 'Field(s) is empty.'));

        const event = await Event.findById(req.params.eventId).select('reviews rating');

        if (!event) {
            return next(createError(404, 'Event does not exists'));
        }

        const reviews = [...event.reviews];

        const existedUserReview = reviews.find(review => review.userId.toString() === req.userId.toString());

        if (!existedUserReview) {
            return next(createError(404, 'Review does not exists'));
        }

        event.reviews = reviews.map(review =>
            review.userId.toString() === existedUserReview.userId.toString() ?
                { ...review, rating: rating, comment: comment } :
                review
        );
        await event.save();

        let totalRating = 0;
        const totalUser = event.reviews.length;
        totalUser > 0 && event.reviews.forEach(review => totalRating += review.rating);

        event.rating = (totalRating / totalUser);
        await event.save();

        createResponse(res, 200, { message: 'Review edited' });

    } catch (error) {
        next(error);
    }
}

exports.likeEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId).select('likes');

        if (!event) {
            return next(createError(404, 'Event does not exists'));
        }

        if (event.likes.includes(req.userId.toString())) {
            await event.updateOne({ $pull: { likes: req.userId } });
            return createResponse(res, 200, { message: 'You disliked this Event' });
        }

        await event.updateOne({ $push: { likes: req.userId } });

        createResponse(res, 200, { message: 'You liked this Event' });

    } catch (error) {
        next(error);
    }
}