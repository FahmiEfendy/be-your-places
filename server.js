const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const logger = require("./utils/logger");
require("dotenv").config();

const HttpError = require("./models/http-error");
const usersRoutes = require("./routes/users-routes");
const placesRoutes = require("./routes/places-routes");

const app = express();

// Request Logger
app.use((req, res, next) => {
  res.on("finish", () => {
    const message = `${req.method} ${req.originalUrl} ${res.statusCode}`;
    if (res.statusCode >= 400) {
      logger.error(message);
    } else {
      logger.info(message);
    }
  });
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Routes
app.get("/api/health", async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected) {
      return res.status(500).json({ status: "DOWN", database: "disconnected" });
    }
    res.status(200).json({ 
      status: "UP", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: "DOWN", error: err.message });
  }
});

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

// Error Handler for undefined routes
app.use((req, res, next) => {
  const err = new HttpError("Could not find this route.", 404);
  next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Use Winston to log error
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
  });

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
    logger.info("Successfully connected to database!");
  } catch (err) {
    logger.error("Database connection failed:", err);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
});
