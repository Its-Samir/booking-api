const { Notification } = require("../models/Notification");
const User = require("../models/User");

async function createNotification(userId, message) {
    const user = await User.findById(userId).select('_id notifications');
    if (user) {
        const newNotifcation = new Notification({
            userId: user._id,
            message: message
        });

        await newNotifcation.save();
        user.notifications.push(newNotifcation);
        await user.save();
    }
}

module.exports = createNotification;