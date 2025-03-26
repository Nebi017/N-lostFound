const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const connectDatabase = require("./config");
const userRoute = require("./routes/userRoute.js");
const itemRoute = require("./routes/itemRoute.js");
const contactRoutes = require("./routes/contactRoutes.js");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use("/uploads", express.static("uploads"));

connectDatabase();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// POST route to create a new lost/found item
app.use("/api/items", itemRoute);
app.use("/api/contact", contactRoutes);
app.use("/", userRoute);

app.get("/", (request, response) => {
  console.log(request);
  return response.status(234).send("welcome to Mern Stack");
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is listening to port ${port}`);
});
