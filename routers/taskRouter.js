const express = require("express");

const authController = require("../controllers/authController.js");
const { plans } = require("../constants.js");
const taskController = require("../controllers/taskController.js");

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo(plans.ProUpload));

router.route("/").post(taskController.create).get(taskController.returnResult);

router.route("/status").get(taskController.getStatus);

module.exports = router;
