const Joi = require("joi");

const itemJoiSchema = Joi.object({
  itemName: Joi.string().min(3).max(100).required(), // Item name
  category: Joi.string().min(3).max(50).required(), // Item category
  brand: Joi.string().min(1).max(50).allow("").optional(), // Item brand
  primaryColor: Joi.string().min(3).max(30).required(), // Primary color of the item
  secondaryColor: Joi.string().allow("").optional(), // Optional secondary color
  dateLostorFound: Joi.date().required(), // The date the item was lost
  timeLostorFound: Joi.string().max(10).optional(), // Time of loss in HH:MM format
  image: Joi.string().allow("").optional(), // Optional image URL
  additionalInfo: Joi.string().allow("").optional(), // Additional info about the item
  whereLostorFound: Joi.string().min(2).max(30).required(),
  subcity: Joi.string().min(2).max(20).required(),
  location: Joi.string().min(3).max(100).required(), // Where the item was lost or found
  zipcode: Joi.string().min(4).max(10).allow("").optional(), // Zipcode
  contactFirstName: Joi.string().min(1).max(50).required(), // First name
  contactLastName: Joi.string().min(1).max(50).required(), // Last name
  contactPhone: Joi.string().max(15).required(), // Phone number
  contactEmail: Joi.string().email().required(), // Email address
  status: Joi.string().valid("lost", "found", "returned").default("lost"), // Item status
  dateReported: Joi.date().default(Date.now), // Date when the item was reported
  userId: Joi.string().required(),
});

module.exports = itemJoiSchema;
