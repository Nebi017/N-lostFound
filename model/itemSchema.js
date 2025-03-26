
const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String },
  primaryColor: { type: String, required: true },
  secondaryColor: { type: String },
  dateLostorFound: { type: Date, required: true },
  timeLostorFound: { type: String },
  image: { type: String },
  additionalInfo: { type: String },
  whereLostorFound: { type: String, required: true },
  location: { type: String, required: true },
  subcity: { type: String, required: true },
  zipcode: { type: String },
  contactFirstName: { type: String, required: true },
  contactLastName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: { type: String, required: true },
  status: {
    type: String,
    enum: ["lost", "found", "returned"],
    default: "lost",
  },
  dateReported: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});



const LostFound = mongoose.model("LostFound", lostFoundSchema);

module.exports = LostFound;
