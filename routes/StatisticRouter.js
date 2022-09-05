const express = require("express");
const router = express.Router();

const {
    statistic,
    statistic_all,
    statistic_admin
} = require("../controller/StatisticControler");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");

router.get("", auth, statistic);
router.get("/admin", auth, statistic_admin);
router.get("/list", pagination, statistic_all);

module.exports = router;
