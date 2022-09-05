const express = require("express");
const router = express.Router();
const {
  getListDocument,
  editDocument,
  deleteDocument,
  shareDocument,
  moveDocument,
  downloadDocument,
  createFolder,
  addNewDoc,
  copyDoc,
  deleteShareDocument,
  getBreadcrumb,
  preview,
  deleteDocument_v2
} = require("../controller/DocumentsController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");

router.post("/create-folder", auth, createFolder);
router.post("/add-new-doc", auth, addNewDoc);
router.put("/edit/:documentId", auth, editDocument);
router.delete("/delete/:documentId", auth, deleteDocument);
router.post("/share", auth, shareDocument);
router.post("/move", auth, moveDocument);
router.delete("/delete-share/:documentId", auth, deleteShareDocument);
router.post("/download/:documentId", auth, downloadDocument);
router.post("/copy-file", auth, copyDoc);
router.get("/list-docs", pagination, getListDocument);
router.get("/breadcrumb/:documentId", auth, getBreadcrumb);
router.get("/preview/:documentId", preview);
router.delete("/v2/delete", auth, deleteDocument_v2);

module.exports = router;
