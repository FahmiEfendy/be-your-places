const axios = require("axios");
const HttpError = require("../models/http-error");

const API_KEY = process.env.GOOGLE_API_KEY;

async function addressToCoordinates(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${API_KEY}`
  );

  const data = response.data;

  if (!data || data.status === "ZERO_RESULTS") {
    throw new HttpError(
      `Could not find coordinates for address of ${address}`,
      422
    );
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

module.exports = addressToCoordinates;
