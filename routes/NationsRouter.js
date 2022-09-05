const express = require("express");
const router = express.Router();
const {
    addNewNation,
    editNation,
    getListNations,
    displayNameIsExisted,
    getAllNations
} = require("../controller/NationsController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");


router.post("/add-new-nation", auth, addNewNation);
router.put("/edit-nation/:nationId", auth, editNation);
router.get('/existed',auth, displayNameIsExisted);
router.get('/all-nations',auth, getAllNations);
router.get("/list-nations", pagination, getListNations);
module.exports = router;