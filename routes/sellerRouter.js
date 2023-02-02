const express = require("express");
const router = express.Router();
const contoller = require("../controller/sellerContoller");

router.get("/get-detail", contoller.fetch);
router.get("/get-product-list", contoller.productList);

module.exports = router;
