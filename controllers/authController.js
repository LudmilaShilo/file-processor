const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const User = require("../models/userModel.js");
const catchAsync = require("../unit/catchAsync.js");
const AppError = require("../unit/appError.js");
const Email = require("../unit/email.js");
require("../config.js");

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRED_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = createToken(user._id);
  const cookieParams = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRED_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  // on the production use only https
  if (process.env.NODE_ENV === "production") cookieParams.secure = true;
  res.cookie("jwt", token, cookieParams);
  // don't show password hash in the client response
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

exports.signUp = catchAsync(async (req, res) => {
  console.log("body", req.body);
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Pls, provide email and password", 400));
  }
  const user = await User.findOne({ email }).select("password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Email or password incorrect", 401));
  }
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "log out", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  const headers = req.headers;
  let token;
  if (headers.authorization?.startsWith("Bearer")) {
    token = headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError("You are not logged in. Pls, log in to get access!", 401)
    );
  }

  // check is token valid
  const decoder = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoder.id);
  if (!currentUser) {
    return next(new AppError("The user does not exists", 404));
  }

  // check if password didn't change
  if (currentUser.isPasswordChanged(decoder.iat)) {
    return next(
      new AppError("The password was changed. Pls, log in again", 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (!req.cookies.jwt) {
    return next();
  }

  // check is token valid
  let decoder;
  try {
    decoder = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );
  } catch (err) {
    return next();
  }

  const currentUser = await User.findById(decoder.id);
  if (!currentUser) {
    return next();
  }

  // check if password didn't change
  if (currentUser.isPasswordChanged(decoder.iat)) {
    return next();
  }

  res.locals.user = currentUser;

  next();
});

exports.forgotPassword = catchAsync(async function (req, res, next) {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new AppError("No user with this email", 404));
  }

  // create reset token
  const resetToken = user.createPasswordResetToken();
  await user.save(); // to save changes in the document
  try {
    // send reset token to email
    const url = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, url).sendResetPassword();
    res.status(200).json({
      status: "success",
      message: "your password reset token (valid for 10 min)",
    });
  } catch (err) {
    user.resetToken = undefined;
    user.resetTokenExpired = undefined;
    await user.save();
    console.error("ERROR send mail>>>>", err);
    next(new AppError("The email does not send. Try later.", 500));
  }
});

exports.resetPassword = catchAsync(async function (req, res, next) {
  // check is token valid and not expired
  const resetToken = req.params.token;
  const user = await User.findOne({
    resetToken,
    resetTokenExpired: { $gt: Date.now() },
  });
  if (!user) {
    next(new AppError("The token is invalid or expired", 403));
  }
  // check if password match passwordConfirm + save hash of a new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetToken = undefined;
  user.resetTokenExpired = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async function (req, res, next) {
  const user = req.user;
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("The password is not correct. Try again", 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createSendToken(user, 200, res);
});
