const express = require("express");
const router = express.Router();
const {
  addNewTopic,
  editTopic,
  deleteTopic,
  shareTopic,
  deleteShareTopic,
  getListTopics,
  getKeyWordTopic,
  getKeyFromDrive,
  getListAllTopics
} = require("../controller/TopicsController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");
router.post("/add", auth, addNewTopic);
router.put("/edit/:topicId", auth, editTopic);
router.delete("/delete/:topicId", auth, deleteTopic);
router.post("/share", auth, shareTopic);
router.delete("/delete-share", auth, deleteShareTopic);
router.get("/get-list", pagination, getListTopics);
router.post("/key-topics", auth, getKeyWordTopic);
router.post("/key-drive-topics", auth, getKeyFromDrive);
router.get("/get-all-list", auth, getListAllTopics);


module.exports = router;
