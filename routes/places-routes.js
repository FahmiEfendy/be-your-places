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
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

// api/places/:pid
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

// api/places/:pid
router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
