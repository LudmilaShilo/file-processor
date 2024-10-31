const crypto = require("crypto");

const mongoose = require("mongoose");
const validator = require("validator");
const bcript = require("bcryptjs");
require("../config.js");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Pls, tell us your name!"],
    },
    email: {
      type: String,
      required: [true, "Pls, provide your email."],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Pls provide a valid email"],
    },
    password: {
      type: String,
      require: [true, "Pls, provide a password"],
      minlength: 8,
    },
    passwordConfirm: {
      type: String,
      require: [true, "Pls, confirm a password"],
      validate: {
        // work only with SAVE
        validator: function (val) {
          return val === this.password;
        },
        message: "Passwords are not the same",
      },
    },
    passwordChangeAt: Date,
    resetToken: String,
    resetTokenExpired: Date,
    active: {
      type: Boolean,
      select: false,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcript.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } }), next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcript.compare(candidatePassword, userPassword);
};

userSchema.methods.isPasswordChanged = function (tokenCreated) {
  if (!this.passwordChangeAt) {
    return false;
  }
  let timePasswordChanged = this.passwordChangeAt.getTime() / 1000;
  return timePasswordChanged > tokenCreated;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetToken = crypto
    .createHmac("sha512", process.env.CRYPTO_KEY)
    .update(resetToken)
    .digest("hex");
  this.resetTokenExpired = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
