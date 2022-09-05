const express = require("express");
const router = express.Router();

const {
    getListLog,
    getListUsers,
    getListGroups,
    getListAction
} = require("../controller/ActivityLogController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");

router.get("/list-logs", pagination, getListLog);
router.get("/list-users", auth, getListUsers);
router.get("/list-groups", auth, getListGroups);
router.get("/list-actions", auth, getListAction);
module.exports = router;
