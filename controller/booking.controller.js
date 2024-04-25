const Booking = require("../models/Booking");
const createError = require("../utils/create-error");
const createResponse = require("../utils/create-response");
const User = require("../models/User");

exports.getBookings = async (req, res, next) => {
    try {
        const tab = req.query.tab || 1;
        const { userId } = req;
        const user = await User.findById(userId).select('bookings');

        if (!user) {
            return next(createError(404, 'User does not exists'));
        }

        const mappedIds = user.bookings.map(booking => booking.bookingId);

        const totalBooking = await Booking.countDocuments({ _id: mappedIds });

        const hasNextPage = (totalBooking / tab) > 4;
        const hasPrevPage = tab > 1;

        const bookings = await Booking.find({ _id: mappedIds }).select('-updatedAt').skip((tab - 1) * 4).limit(4);

        createResponse(res, 200, { bookings, hasNextPage, hasPrevPage });

    } catch (error) {
        next(error);
    }
}

exports.getBooking = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findOne({ $and: [{ _id: bookingId }, { userId: req.userId }] });

        if (!booking) {
            return next(createError(404, 'Booking does not exists'));
        }

        createResponse(res, 200, { booking });

    } catch (error) {
        next(error);
    }
}

exports.deleteBooking = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        // we cannot access deleteOne() mehtod if we use Booking.exists() method
        const booking = await Booking.findOne({ _id: bookingId }).select('_id');

        if (!booking) {
            return next(createError(404, 'Booking not found'));
        }

        await booking.deleteOne();

        createResponse(res, 200, { message: 'Booking deleted' });

    } catch (error) {
        next(error);
    }
}