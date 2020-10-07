const express = require("express");
const Controller = require("./sendDMController");
const router = express.Router();

router.post("/activity", Controller.sendMessage);

module.exports = router;
