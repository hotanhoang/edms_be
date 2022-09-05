const express = require("express");
const router = express.Router();

const {
    getAllGroups,
    getListGroups,
    addNewGroup,
    editGroup,
    getListPositions,
    getParentGroup,
    displayNameIsExisted
} = require("../controller/GroupsController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");

router.get("/get-list", auth, getAllGroups);
router.post("/add-new-group", auth, addNewGroup);
router.put("/edit-group/:groupId", auth, editGroup);
router.get("/list-groups", pagination, getListGroups);
router.get('/list_positions/:groupId', auth, getListPositions);
router.get('/list-parentGroup',auth, getParentGroup);
router.get('/existed',auth, displayNameIsExisted);
module.exports = router;
