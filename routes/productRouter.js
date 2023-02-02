const express = require("express");
const router = express.Router();
const contoller = require("../controller/productController");

router.get("/retrieve", contoller.fetch);

module.exports = router;
