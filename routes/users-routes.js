const express = require("express");
const { check } = require("express-validator");

const router = express.Router();

const { fileUploadMiddleware } = require("../middleware/file-upload");

const usersControllers = require("../controllers/users-controllers");

// api/users/
router.get("/", usersControllers.getAllUsers);

// api/users/signup
router.post(
  "/signup",
  fileUploadMiddleware,
  usersControllers.signUp
);

// api/users/login
router.post("/login", usersControllers.login);

module.exports = router;
