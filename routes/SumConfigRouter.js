const express = require("express");
const router = express.Router();
const {
    addSumConfig,
    getAlgorConfig,
    getUserConfig,
    setConfigDefault,
    addAlgor,
    editAlgor
} = require("../controller/SumConfigController");

const auth = require("../middleware/auth");

router.post("/sum-config", auth, addSumConfig)
router.get("/list-algor", auth, getAlgorConfig)
router.get("/user-config", auth, getUserConfig)
router.put("/config-default", auth, setConfigDefault)
router.post("/add-algor", addAlgor)
router.post("/edit-algor", editAlgor)


module.exports = router;