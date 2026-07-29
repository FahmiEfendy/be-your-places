const express = require("express");
const { check } = require("express-validator");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const fileUpload = require("../middleware/file-upload");
const usersControllers = require("../controllers/users-controllers");

// Rate limiting for auth endpoints (brute-force prevention)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: "Too many login or signup attempts from this IP, please try again after 15 minutes." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// api/users/
router.get("/", usersControllers.getAllUsers);

// api/users/signup
router.post(
  "/signup",
  authLimiter,
  fileUpload.single("image"),
  [
    check("name").trim().escape().notEmpty().withMessage("Name is required."),
    check("email").normalizeEmail().isEmail().withMessage("Please provide a valid email address."),
    check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long.")
  ],
  usersControllers.signUp
);

// api/users/login
router.post(
  "/login",
  authLimiter,
  [
    check("email").normalizeEmail().isEmail().withMessage("Please provide a valid email address."),
    check("password").notEmpty().withMessage("Password is required.")
  ],
  usersControllers.login
);

module.exports = router;
