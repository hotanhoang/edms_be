const express = require("express");
const router = express.Router();

const {
    getListPos,
    addNewPos,
    editPos,
    getAllPos,
    getAllRole,
    displayNameIsExisted
} = require("../controller/PositionsController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");

router.post("/add-new-position", auth, addNewPos);
router.put("/edit-position/:posId", auth, editPos);
router.get("/list-positions", pagination, getListPos);
router.get("/get-list", auth, getAllPos);
router.get("/list-all-role", auth, getAllRole)
router.get("/existed", auth, displayNameIsExisted)
module.exports = router;
