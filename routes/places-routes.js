const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/check-auth");
const fileUpload = require("../middleware/file-upload");

const placesControllers = require("../controllers/places-controllers");

const router = express.Router();

// api/places/
router.get("/", placesControllers.getAllPlaces);

// api/places/user/:uid
router.get("/user/:uid", placesControllers.getPlacesByUserId);

// api/places/:pid
router.get("/:pid", placesControllers.getPlaceByPlaceId);

// ROUTE ABOVE THIS CAN BE ACCESSED WITHOUT AUTHENTICATION
router.use(checkAuth);
// ROUTE BELOW THIS CANNOT BE ACCESSED WITHOUT AUTHENTICATION

// api/places/
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").trim().escape().notEmpty().withMessage("Title is required."),
    check("description").trim().escape().isLength({ min: 5 }).withMessage("Description must be at least 5 characters long."),
    check("address").trim().escape().notEmpty().withMessage("Address is required."),
  ],
  placesControllers.createPlace
);

// api/places/:pid
router.patch(
  "/:pid",
  fileUpload.single("image"),
  [
    check("title").trim().escape().notEmpty().withMessage("Title is required."),
    check("description").trim().escape().isLength({ min: 5 }).withMessage("Description must be at least 5 characters long.")
  ],
  placesControllers.updatePlace
);

// api/places/:pid
router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
