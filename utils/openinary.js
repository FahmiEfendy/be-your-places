const axios = require("axios");
const FormData = require("form-data");

const API_KEY = process.env.OPENINARY_API_KEY;
const OPENINARY_URL = process.env.OPENINARY_URL || "http://localhost:3000";

const uploadImage = async (buffer, filename) => {
  if (!API_KEY) {
    console.warn("OPENINARY_API_KEY is not set. Upload may fail.");
  }

  const form = new FormData();
  form.append("file", buffer, filename);

  try {
    const response = await axios.post(`${OPENINARY_URL}/api/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    // Assuming Openinary returns an object with public_id or url
    return response.data;
  } catch (error) {
    console.error(
      "Openinary upload error:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not upload image to Openinary.");
  }
};

const deleteImage = async (publicId) => {
  try {
    await axios.delete(`${OPENINARY_URL}/api/media/${publicId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });
  } catch (error) {
    console.error(
      "Openinary delete error:",
      error.response ? error.response.data : error.message
    );
    // We don't necessarily want to throw here if the image is already gone
  }
};

module.exports = { uploadImage, deleteImage };
