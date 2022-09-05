const express = require("express");
const router = express.Router();

const {
    getNumberOfNotifications,
    getListNotification,
    seenNotification
} = require("../controller/NotificationController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");

router.get("/number-notifications", auth, getNumberOfNotifications);
router.get("/list-notifications", pagination, getListNotification);
router.get("/seen-notification", auth, seenNotification);

module.exports = router;