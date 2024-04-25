const { Notification } = require("../models/Notification");
const createResponse = require("../utils/create-response");

exports.getNotifications = async (req, res, next) => {
    try {
        const tab = req.query.tab || 1;
        const total = await Notification.countDocuments({ userId: req.userId });

        const hasNextPage = (total / tab) > 4;
        const hasPrevPage = tab > 1;

        const notifications = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).skip((tab - 1) * 4).limit(4);

        createResponse(res, 200, { notifications, hasNextPage, hasPrevPage });

    } catch (error) {
        next(error);
    }
}

exports.updateNotification = async (req, res, next) => {
    await Notification.findByIdAndUpdate(req.params.id, { $set: { read: true } }).select('_id');
}

exports.deleteNotification = async (req, res, next) => {
    await Notification.findByIdAndDelete(req.params.id);
}