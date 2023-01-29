const express = require("express");
const router = express.Router();
const contoller = require("../controller/makerContoller");

router.get("/retrieve", contoller.fetch);

module.exports = router;
