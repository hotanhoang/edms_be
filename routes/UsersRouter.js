const express = require("express");
const router = express.Router();
const {
  logIn,
  logOut,
  addUser,
  editUserInfo,
  removeUser,
  getListUser,
  onRefreshToken,
  getListRole,
  getListUserShare,
  getUserShareDocs,
  getUserShareTopic,
  getUserShareEvent
} = require("../controller/UsersController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");
router.post("/login", logIn);
router.post("/logout", logOut);
router.post("/add-new", auth, addUser);
router.put("/edit-info/:userID", auth, editUserInfo);
router.delete("/remove/:userID", auth, removeUser);
router.get("/get-role", auth, getListRole);
router.post("/refresh-token", onRefreshToken);
router.get("/list-users", pagination, getListUser);
router.get("/list-users-share", pagination, getListUserShare);
router.get("/doc-share-users/:documentId", pagination, getUserShareDocs);
router.get("/topic-share-users/:topicId", pagination, getUserShareTopic);
router.get("/event-share-users/:eventId", pagination, getUserShareEvent);

module.exports = router;
