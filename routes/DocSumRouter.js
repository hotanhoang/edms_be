const express = require("express");
const router = express.Router();
const {
    addSumResult,
    sumDoc, getDocSum, deleteDocSum, uploadFileSum, previewDocSum, downloadDocSum, selectSumDoc, entityMark, editDocSum
} = require("../controller/DocSumController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");

router.post("/single-text", auth, sumDoc)
router.post("/add-new", auth, addSumResult)
router.get("/list-sum", pagination, getDocSum)
router.delete("/remove-sum/:docSumId", auth, deleteDocSum)
router.put("/edit-sum/:inDocSumId", auth, editDocSum)
router.post("/upload-file", auth, uploadFileSum)
router.post("/select-file", auth, selectSumDoc)
router.get("/preview/:filename", previewDocSum);
router.post("/download", auth, downloadDocSum);
router.post("/entity-mark", auth, entityMark);


module.exports = router;