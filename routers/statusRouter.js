const express = require("express");

const authController = require("../controllers/authController.js");
const { plans } = require("../constants.js");
const statusController = require("../controllers/statusController.js");

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo(plans.ProUpload));

router.route("/").get(statusController.getStatus);
router.route("/updates").get(statusController.SSEconnector);

module.exports = router;
