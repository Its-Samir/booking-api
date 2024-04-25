const express = require('express');
const { getNotifications, deleteNotification, updateNotification } = require('../controller/notification.controller');
const { verifyToken } = require('../utils/verify-auth');

const router = express.Router();

router.get('/notifications', verifyToken, getNotifications);

router.put('/notifications/:id', verifyToken, updateNotification);

router.delete('/notifications/:id', verifyToken, deleteNotification);

module.exports = router;