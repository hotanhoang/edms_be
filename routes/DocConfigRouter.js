const express = require("express");
const router = express.Router();
const {
    get_config, 
    edit_config
} = require("../controller/DocConfigController");

const auth = require("../middleware/auth");


router.get("/get_config", auth, get_config);
router.put("/edit_config/:id", auth, edit_config);
module.exports = router;
