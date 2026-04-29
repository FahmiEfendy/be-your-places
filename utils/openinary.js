const axios = require("axios");
const FormData = require("form-data");
const logger = require("./logger");

const API_KEY = process.env.OPENINARY_API_KEY;
const OPENINARY_URL = process.env.OPENINARY_URL || "http://localhost:3000";

const uploadImage = async (buffer, filename) => {
  if (!API_KEY) {
    console.warn("OPENINARY_API_KEY is not set. Upload may fail.");
  }

  const form = new FormData();
  form.append("image", buffer, filename);

  logger.info("Openinary Upload Debug:", {
    url: `${OPENINARY_URL}/api/upload`,
    apiKeyExists: !!API_KEY,
    apiKeyLength: API_KEY.length,
    apiKeyPreview: API_KEY ? `${API_KEY.substring(0, 5)}...` : "NONE",
  });

  try {
    const response = await axios.post(`${OPENINARY_URL}/api/upload`, form, {
      headers: {
        ...form.getHeaders(),
        // Trying both common formats for API keys
        "Authorization": `Bearer ${API_KEY}`,
        "X-API-Key": API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      logger.error("Openinary upload error (Response):", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else {
      logger.error("Openinary upload error (Message):", error.message);
    }
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
