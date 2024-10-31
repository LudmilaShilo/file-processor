const express = require("express");

const authController = require("../controllers/authController.js");
const taskController = require("../controllers/taskController.js");

const router = express.Router();

router.use(authController.protect);

router.route("/").post(taskController.create).get(taskController.returnResult);

module.exports = router;
