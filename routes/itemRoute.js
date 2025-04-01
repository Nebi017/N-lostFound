const express = require("express");
const LostFound = require("../model/itemSchema.js"); // Your schema file
const itemJoiSchema = require("../middlewares/joiSchema.js");
const isAuthenticated = require("../middlewares/authMiddleware.js");
const upload = require("../middlewares/upload.js");
// const { saveItem } = require("../middlewares/itemcontroller.js");
// const findMatches = require ("../middlewares/matchQueus.js")

const router = express.Router();

router.post("/", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    console.log("User Object:", req.user); // Debug: Check the user object
    console.log("User ID:", req.user ? req.user._id : "User ID is missing");
    console.log("Uploaded file:", req.file);
    // Validate the request body with Joi
    const { error } = itemJoiSchema.validate(req.body);
    if (error) {
      console.log("Validation Error:", error.details);
      return res.status(400).send({ message: error.details[0].message });
    }

    // Ensure req.user is set correctly
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // If an image was uploaded, get the file path
    const imageUrl = req.file ? req.file.path : null;

    // Create a new item object based on the request data
    const newItem = new LostFound({
      itemName: req.body.itemName,
      category: req.body.category,
      brand: req.body.brand,
      primaryColor: req.body.primaryColor,
      secondaryColor: req.body.secondaryColor,
      dateLostorFound: new Date(req.body.dateLostorFound), // Ensure this is a valid date
      timeLostorFound: req.body.timeLostorFound,
      image:imageUrl, 
      additionalInfo: req.body.additionalInfo,
      whereLostorFound: req.body.whereLostorFound,
      subcity: req.body.subcity,
      location: req.body.location,
      zipcode: req.body.zipcode,
      contactFirstName: req.body.contactFirstName,
      contactLastName: req.body.contactLastName,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      status: req.body.status,
      dateReported: new Date(), // Current date
      userId: req.user._id, // Use req.user._id instead of request.user.id
    });
    // Save the new item to the database
    await newItem.save();

    res
      .status(201)
      .send({ message: "Item created successfully", item: newItem });
  } catch (ex) {
    console.error("Error creating item:", ex);
    res.status(500).send({ message: "Internal server error" });
  }
});

router.get("/recent-items", async (req, res) => {
  try {
    const { status } = req.query; // "lost" or "found"
    const items = await LostFound.find({ status })
      .limit(12)
      .sort({ dateReported: -1 }); // Sort by the most recent items
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Error fetching items", error });
  }
});

router.get("/search", async (req, res) => {
  const {
    search,
    category,
    location,
    subcity,
    sort,
    page = 1,
    limit = 9,
  } = req.query;

  // Build the query object
  const query = {};
  if (search) query.itemName = { $regex: `.*${search}.*`, $options: "i" };
  if (category) {
    const categoriesArray = Array.isArray(category) ? category : [category]; // Ensure it's an array
    query.category = {
      $in: categoriesArray.map((cat) => new RegExp(cat, "i")), // Match anywhere in the string, case-insensitive
    };
  }

  if (location) {
    query.location = { $regex: location, $options: "i" }; // Match anywhere in the string, case-insensitive
  }

  if (subcity) {
    const subcitiesArray = subcity.split(","); // Convert comma-separated string to array

    // Create an array of regex conditions for each subcity
    const subcityRegexConditions = subcitiesArray.map((sub) => ({
      subcity: { $regex: sub, $options: "i" }, // Case-insensitive regex
    }));

    // Use $or to match any of the subcity regex conditions
    query.$or = subcityRegexConditions;
  }
  // Build the sort object
  let sortOptions = { dateReported: -1 }; // Default sorting (Most Recent Reports)
  if (sort === "itemName") sortOptions = { itemName: 1 }; // Sort by name (A-Z)
  if (sort === "dateLostorFound") sortOptions = { dateLostorFound: -1 }; // Sort by date (Newest First)
  if (sort === "dateOldest") sortOptions = { dateLostorFound: 1 }; // Sort by date (Oldest First)

  // Pagination
  const skip = (page - 1) * limit;

  try {
    const items = await LostFound.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.json({
      items,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Backend Route to fetch items for the authenticated user
router.get("/user-items", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // Use `req.user._id` instead of `request.user.id`
    const userItems = await LostFound.find({ userId });
    console.log("User Items:", userItems); // Debugging
    res.json(userItems || []);
  } catch (error) {
    console.error("Error fetching user items:", error);
    res.status(500).json({ error: "Server Error", items: [] });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await LostFound.findByIdAndUpdate(id, req.body);
    if (!result) {
      res.status(403).send("Item Not Found");
    }
    res.status(200).send({
      message: "item  Updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ message: error.message });
  }
});

router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ message: "Error fetching item", error: err });
  }
});

router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const deletedItem = await LostFound.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting item", error: err });
  }
});

// router.get("/matches/:lostItemId", async (req, res) => {
//   try {
//     const matches = await findMatches(req.params.lostItemId);
//     res.json(matches);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// router.post("/items", saveItem);

module.exports = router;
