const express = require("express");
const router = express.Router();
const contoller = require("../controller/productController");

router.get("/get-detail", contoller.fetch);

module.exports = router;
