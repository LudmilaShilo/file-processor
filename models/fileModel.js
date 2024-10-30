const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      require: [true, "File must belong to a User"],
    },
    name: {
      type: String,
      required: [true, "File must have name"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const File = mongoose.model("File", fileSchema);

module.exports = File;
