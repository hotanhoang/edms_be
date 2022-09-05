const express = require("express");
const router = express.Router();
const {
    sumDoc, selectSumDoc, addSumResult, getSumDoc, deleteDocSum
} = require("../controller/MultiSumController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");

router.post("/multi-text", auth, sumDoc)
router.post("/select-file", auth, selectSumDoc)
router.post("/add-new", auth, addSumResult)
router.get("/list-sum", pagination, getSumDoc)
router.delete("/remove-sum/:inMultiDocSumId", auth, deleteDocSum)

module.exports = router;