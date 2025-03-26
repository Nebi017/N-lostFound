const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/userModel.js");
const sendVerificationEmail = require("../services/emailservice.js");
const isAuthenticated = require("../middlewares/authMiddleware.js");
const isAdmin = require("../middlewares/isAdmin");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

dotenv.config();

const router = express.Router();

router.post("/user/signup", async (request, response) => {
  try {
    const { username, password, email } = request.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return response
        .status(400)
        .json({ message: "username or email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      const verificationToken = jwt.sign(
        { id: newUser._id },
        process.env.SECRET_KEY,
        { expiresIn: "5hr" }
      );

      await sendVerificationEmail(newUser.email, verificationToken);

      response.status(201).json({
        message:
          "User registered. Please verify your email to activate your account.",
      });
    } else {
      return response.status(400).json({
        message: "Invalid user data",
      });
    }
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

router.post("/user/signin", async (request, response) => {
  try {
    const { username, password } = request.body;
    const user = await User.findOne({ username });

    if (!user) {
      return response.status(401).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return response.status(401).json({ message: "Invalid password" });
    }

    if (!user.isVerified) {
      return response.status(400).json({
        message: "Please verify your email before logging in.",
      });
    }

    // Include `role` in the token
    const token = jwt.sign(
      { userId: user._id, isLogged: true, role: user.role }, // Add role here
      process.env.SECRET_KEY,
      { expiresIn: "5hr" }
    );

    return response.status(200).json({
      token,
      username: user.username,
      role: user.role, // Return role in response
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

router.get("/user/verify-email", async (request, response) => {
  try {
    const { token } = request.query;

    if (!token) {
      return response.status(400).json({
        message: "Invalid or missing token.",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Find the user
    const user = await User.findById(decoded.id);
    if (!user) {
      return response.status(400).json({
        message: "User not found.",
      });
    }

    // Check if the email is already verified
    if (user.isVerified) {
      return response.status(200).json({
        message: "",
      });
    }

    // Mark the email as verified
    user.isVerified = true;
    await user.save();

    // Success response
    response.status(200).json({
      message: "Email verified! You can now log in.",
    });
  } catch (error) {
    console.error(error);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return response.status(400).json({
        message: "Invalid or expired token.",
      });
    }

    response.status(500).json({ message: "Internal server error" });
  }
});

router.get("/admin/users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Fetch all users without password

    if (!users.length) {
      return res.status(404).json({ message: "No users found." });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Internal server error while fetching users." });
  }
});

router.delete("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
});

const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., Gmail, Outlook)
  auth: {
    user: process.env.ADMIN_EMAIL, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

// Forgot Password Endpoint
router.post("/user/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      to: user.email,
      from: process.env.ADMIN_EMAIL,
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste it into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error in /user/forgot-password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reset Password Endpoint

router.post("/user/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const decodedToken = decodeURIComponent(token); // Decode the token
  const { password } = req.body;

  console.log("Received Token:", decodedToken); // Log the decoded token

  try {
    const user = await User.findOne({
      resetPasswordToken: decodedToken, // Use the decoded token
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log("Invalid or expired token for:", decodedToken); // Log the invalid token
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in /user/reset-password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
module.exports = router;
