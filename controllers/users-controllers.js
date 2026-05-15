const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

const User = require("../models/user");
const HttpError = require("../models/http-error");
const { uploadImage } = require("../utils/openinary");

const JWT_TOKEN_KEY = process.env.JWT_TOKEN_KEY;

const getAllUsers = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  let allUsers;
  let totalCount;
  try {
    totalCount = await User.countDocuments();
    allUsers = await User.find({}, "-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } catch (err) {
    return next(new HttpError("Fetching users failed, please try again later.", 500));
  }

  res.status(200).json({
    message: "Successfully get all users data",
    data: allUsers.map((user) => user.toObject({ getters: true })),
    meta: {
      total: totalCount,
      page,
      limit,
      hasMore: skip + allUsers.length < totalCount
    }
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

  let imagePath;
  if (req.file) {
    // Upload to Openinary
    let imageData;
    try {
      imageData = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype, "Your_Places/profile");
      // Only log the essential info to avoid circular reference crashes
      logger.info("Openinary Upload Success! Data received.");
    } catch (err) {
      return next(new HttpError("Image upload failed.", 500));
    }

    // Openinary might return a string that needs parsing
    let processedData = imageData;
    if (typeof imageData === "string") {
      try {
        processedData = JSON.parse(imageData);
      } catch (e) {
        logger.error("Failed to parse Openinary response as JSON.");
      }
    }

    // Openinary returns an object with a 'files' array
    let imageInfo = processedData;
    if (processedData && processedData.files && Array.isArray(processedData.files)) {
      imageInfo = processedData.files[0];
    } else if (Array.isArray(processedData)) {
      imageInfo = processedData[0];
    }

    imagePath = imageInfo ? (imageInfo.url || imageInfo.id || imageInfo.public_id || imageInfo.path) : null;
  } else if (req.body.image || req.body.imageUrl) {
    imagePath = req.body.image || req.body.imageUrl;
  }

  if (!imagePath) {
    return next(new HttpError("No image provided (upload or URL required).", 422));
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
