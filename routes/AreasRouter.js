const express = require("express");
const router = express.Router();
const {
    addNewArea,
    editArea,
    getListAreas,
    getAllAreas,
    displayNameIsExisted
} = require("../controller/AreasController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");


router.post("/add-new-area", auth, addNewArea);
router.put("/edit-area/:areaId", auth, editArea);
router.get("/list-areas", pagination, getListAreas);
router.get("/list-all-areas",auth, getAllAreas )
router.get("/existed",auth, displayNameIsExisted )
module.exports = router;
