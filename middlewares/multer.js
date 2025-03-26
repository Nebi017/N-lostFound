const multer = require("multer");

// Set storage options for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save images to the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Generate a unique name for the file
  },
});

// Create the multer instance
const upload = multer({ storage: storage });
module.exports = upload;
