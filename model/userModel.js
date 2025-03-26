const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add a username"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"], // Only allow "user" or "admin"
      default: "user", // By default, every user is a normal user
    },
    resetPasswordToken: {
      type: String,
      default: null, // Initially, no reset token is set
    },
    resetPasswordExpires: {
      type: Date,
      default: null, // Initially, no expiration time is set
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
