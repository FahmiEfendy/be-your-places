const fs = require("fs");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const HttpError = require("./models/http-error");
const usersRoutes = require("./routes/users-routes");
const placesRoutes = require("./routes/places-routes");

const app = express();

app.use(morgan(process.env.LOG_FORMAT || "dev")); // Log every request to the console
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

// Routes
app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

// Error Handler for undefined routes
app.use((req, res, next) => {
  const err = new HttpError("Could not find this route.", 404);
  next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Trace error in console
  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  if (res.headerSent) {
    return next(err);
  }
  res
    .status(err.status || err.code || 500)
    .json({ error: err.message || "Internal Server Error" });
});

// MongoDB Connection
const connectDB = async () => {
  const { DB_USER, DB_PASSWORD, DB_NAME, MONGODB_URI } = process.env;

  // Use MONGODB_URI if provided, otherwise construct the Atlas URI
  const mongoUri = MONGODB_URI || `mongodb+srv://${encodeURIComponent(DB_USER)}:${encodeURIComponent(
    DB_PASSWORD
  )}@${DB_NAME}.o1y8qtm.mongodb.net/?retryWrites=true&w=majority&appName=${DB_NAME}`;

  console.log("Connecting to MongoDB:", mongoUri.replace(/\/\/.*:.*@/, "//admin:****@"));

  try {
    await mongoose.connect(mongoUri);
    console.log("Successfully connected to database!");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
