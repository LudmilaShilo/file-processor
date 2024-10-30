const express = require("express");

const authController = require("../controllers/authController.js");

const userController = require("../controllers/userController.js");
const { plans } = require("../constants.js");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.use(authController.protect);

router.patch("/updatePassword", authController.updatePassword);

// for test only - need to delete
router.use(authController.restrictTo(plans.ProUpload));

router.route("/").post(userController.startSession);

module.exports = router;
