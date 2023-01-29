const express = require("express");
const router = express.Router();
const contoller = require("../controller/scrapeController");

router.get("/maker", contoller.scrape);
router.get("/all", contoller.scrapeAll);

module.exports = router;
