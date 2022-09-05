const express = require("express");
const router = express.Router();
const {
    getListUsers,
    getListChildrentGroup,
    groupsManager,
    usersManager
} = require("../controller/AssignmentController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");


router.get("/list-childrenGroup", auth, getListChildrentGroup);
router.get("/list-manager", pagination, getListUsers);
router.post("/groupsManager", auth, groupsManager);
router.post("/usersManager", auth, usersManager);
module.exports = router;
