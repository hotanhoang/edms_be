const express = require("express");
const router = express.Router();
const {
  addNewEvent,
  editEvent,
  deleteEvent,
  shareEvent,
  deleteShareEvent,
  getListEvent,
} = require("../controller/EventsController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");
router.post("/add", auth, addNewEvent);
router.put("/edit/:eventId", auth, editEvent);
router.delete("/delete/:eventId", auth, deleteEvent);
router.post("/share", auth, shareEvent);
router.delete("/delete-share", auth, deleteShareEvent);
router.get("/get-list", pagination, getListEvent);
module.exports = router;
