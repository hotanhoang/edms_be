const express = require("express");
const router = express.Router();
const {
    addNewDomain,
    editDomain,
    getListDomains,
    displayNameIsExisted,
    getAllDomains
} = require("../controller/DomainController");

const auth = require("../middleware/auth");
const pagination = require("../middleware/pagination");


router.post("/add-new-domain", auth, addNewDomain);
router.put("/edit-domain/:domainId", auth, editDomain);
router.get("/list-domains", pagination, getListDomains);
router.get("/all-domains", auth, getAllDomains);
router.get("/existed", auth, displayNameIsExisted);

module.exports = router;
