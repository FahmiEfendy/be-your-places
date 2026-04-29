const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

const User = require("../models/user");
const HttpError = require("../models/http-error");
const { uploadImage } = require("../utils/openinary");

const JWT_TOKEN_KEY = process.env.JWT_TOKEN_KEY;

const getAllUsers = async (req, res, next) => {
  let allUsers;
  try {
    allUsers = await User.find({}, "-password");
  } catch (err) {
    return next(new HttpError("Fetching users failed, please try again later.", 500));
  }

  res.status(200).json({
    message: "Successfully get all users data",
    data: allUsers.map((user) => user.toObject({ getters: true })),
  });
};

const signUp = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }

  const { name, email, password } = req.body;

  let userExist;
  try {
    userExist = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Signing up failed, please try again later.", 500));
  }

  if (userExist) {
    return next(new HttpError("User exists already, please login instead.", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }

  // Upload to Openinary
  let imageData;
  try {
    imageData = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    // Only log the essential info to avoid circular reference crashes
    logger.info("Openinary Upload Success! Data received.");
  } catch (err) {
    return next(new HttpError("Image upload failed.", 500));
  }

  // Openinary returns an array when using 'files' field
  const imageInfo = Array.isArray(imageData) ? imageData[0] : imageData;
  const imagePath = imageInfo ? (imageInfo.public_id || imageInfo.url) : null;

  if (!imagePath) {
    return next(new HttpError("Image upload succeeded but no path was returned.", 500));
  }

  const newUser = new User({
    name,
    email,
    image: imagePath,
    password: hashedPassword,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    return next(new HttpError("Signing up failed, please try again later.", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_TOKEN_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Signing up failed, please try again later.", 500));
  }

  res.status(201).json({
    message: "Successfully added a new user!",
    data: { userId: newUser.id, email: newUser.email, token },
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let userExist;
  try {
    userExist = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Logging in failed, please try again later.", 500));
  }

  if (!userExist) {
    return next(new HttpError("Invalid credentials, could not log you in.", 403));
  }

  let isPasswordValid = false;
  try {
    isPasswordValid = await bcrypt.compare(password, userExist.password);
  } catch (err) {
    return next(new HttpError("Logging in failed, please try again later.", 500));
  }

  if (!isPasswordValid) {
    return next(new HttpError("Invalid credentials, could not log you in.", 403));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: userExist.id, email: userExist.email },
      JWT_TOKEN_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Logging in failed, please try again later.", 500));
  }

  res.status(200).json({
    message: "Login Success!",
    data: { userId: userExist.id, email: userExist.email, token },
  });
};

exports.getAllUsers = getAllUsers;
exports.signUp = signUp;
exports.login = login;
