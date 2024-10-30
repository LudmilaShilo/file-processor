const express = require("express");

const authController = require("../controllers/authController.js");
const { plans } = require("../constants.js");
const fileController = require("../controllers/fileController.js");

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo(plans.ProUpload));

router.route("/").post(fileController.uploadFile);

module.exports = router;
