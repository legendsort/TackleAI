const express = require("express");

const router = express.Router();
const contoller = require("../controller/tokenController");

router.get("/get-token", contoller.getToken);

module.exports = router;
