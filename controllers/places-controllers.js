const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

const User = require("../models/user");
const Place = require("../models/place");
const HttpError = require("../models/http-error");
const addressToCoordinates = require("../utils/location");
const { uploadImage, deleteImage } = require("../utils/openinary");

const getAllPlaces = async (req, res, next) => {
  let result;
  try {
    result = await Place.find();
  } catch (err) {
    return next(new HttpError(`Failed to get all data: ${err.message}`, 500));
  }

  res.status(200).json({
    message: "Successfully get all places from database!",
    data: result.map((place) => place.toObject({ getters: true })),
  });

};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;

  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    return next(new HttpError(`Failed to get user places: ${err.message}`, 500));
  }

  res.status(200).json({
    message: `Successfully get all place from user with id of ${userId}`,
    data: userWithPlaces ? userWithPlaces.toObject({ getters: true }) : { places: [] },
  });
};

const getPlaceByPlaceId = async (req, res, next) => {
  const placeId = req.params.pid;
  let selectedPlace;

  try {
    selectedPlace = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError(`Failed to get place: ${err.message}`, 500));
  }

  if (!selectedPlace) {
    return next(new HttpError(`There is no place with id of ${placeId}`, 404));
  }

  res.json({
    message: `Successfully get a place with id of ${placeId}`,
    data: selectedPlace.toObject({ getters: true }),
  });
};

const createPlace = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }

  const { title, description, address } = req.body;
  let coordinates;
  try {
    coordinates = await addressToCoordinates(address);
  } catch (error) {
    return next(error);
  }

  let imagePath;
  if (req.file) {
    // Upload to Openinary
    let imageData;
    try {
      imageData = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype, "Your_Places/place");
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
        logger.error("Failed to parse Openinary response string:", imageData.substring(0, 100));
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

  const newPlace = new Place({
    title,
    description,
    image: imagePath, // Store the ID or URL
    address,
    coordinates,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError("Creating place failed, please try again.", 500));
  }

  if (!user) {
    return next(new HttpError("Could not find user for provided id", 404));
  }

  try {
    await newPlace.save();
    user.places.push(newPlace);
    await user.save();
  } catch (err) {
    return next(new HttpError("Creating place failed, please try again.", 500));
  }

  res.status(201).json({
    message: "Successfully created new data!",
    data: newPlace.toObject({ getters: true }),
  });
};

const updatePlace = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }

  const { title, description, image, imageUrl } = req.body;
  const placeId = req.params.pid;
  let selectedPlace;

  try {
    selectedPlace = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Updating place failed, please try again.", 500));
  }

  if (!selectedPlace) {
    return next(new HttpError("Could not find place for this id.", 404));
  }

  if (selectedPlace.creator.toString() !== req.userData.userId) {
    return next(new HttpError("You are not authorized to edit this place", 401));
  }

  selectedPlace.title = title;
  selectedPlace.description = description;

  // Handle Image Update
  let newImagePath;
  if (req.file) {
    try {
      const imageData = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype, "Your_Places/place");
      let processedData = imageData;
      if (typeof imageData === "string") {
        processedData = JSON.parse(imageData);
      }
      let imageInfo = processedData;
      if (processedData && processedData.files && Array.isArray(processedData.files)) {
        imageInfo = processedData.files[0];
      } else if (Array.isArray(processedData)) {
        imageInfo = processedData[0];
      }
      newImagePath = imageInfo ? (imageInfo.url || imageInfo.id || imageInfo.public_id || imageInfo.path) : null;
    } catch (err) {
      return next(new HttpError("Image upload failed.", 500));
    }
  } else if (image || imageUrl) {
    newImagePath = image || imageUrl;
  }

  if (newImagePath) {
    const oldImagePath = selectedPlace.image;
    selectedPlace.image = newImagePath;

    // If the old image was an Openinary path (not a full URL), delete it
    if (oldImagePath && !oldImagePath.startsWith("http")) {
      await deleteImage(oldImagePath);
    }
  }

  try {
    await selectedPlace.save();
  } catch (err) {
    return next(new HttpError("Updating place failed, please try again.", 500));
  }

  res.status(200).json({
    message: "Successfully updated a data!",
    data: selectedPlace.toObject({ getters: true }),
  });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let selectedPlace;

  try {
    selectedPlace = await Place.findById(placeId).populate("creator");
  } catch (err) {
    return next(new HttpError("Deleting place failed, please try again.", 500));
  }

  if (!selectedPlace) {
    return next(new HttpError("Could not find place for this id.", 404));
  }

  if (selectedPlace.creator.id !== req.userData.userId) {
    return next(new HttpError("You are not authorized to delete this place", 401));
  }

  const imagePublicId = selectedPlace.image;

  try {
    await selectedPlace.deleteOne();
    selectedPlace.creator.places.pull(selectedPlace);
    await selectedPlace.creator.save();
  } catch (err) {
    return next(new HttpError("Deleting place failed, please try again.", 500));
  }

  // Delete from Openinary
  await deleteImage(imagePublicId);

  res.status(200).json({ message: "Successfully deleted a data!", data: selectedPlace });
};

exports.getAllPlaces = getAllPlaces;
exports.getPlacesByUserId = getPlacesByUserId;
exports.getPlaceByPlaceId = getPlaceByPlaceId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
