const express = require("express");
const router = express.Router();
const Contact = require("../model/contactSchema");

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, contact, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !contact || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Save contact form data to the database
    const newContact = new Contact({
      firstName,
      lastName,
      email,
      contact,
      message,
    });
    await newContact.save();

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error saving contact form:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
