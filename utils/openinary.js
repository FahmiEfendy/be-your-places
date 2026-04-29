const axios = require("axios");
const FormData = require("form-data");
const logger = require("./logger");

const uploadImage = async (buffer, filename, mimetype, folder) => {
  const apiKey = (process.env.OPENINARY_API_KEY || "").trim();
  const baseUrl = (process.env.OPENINARY_URL || "http://localhost:3000").trim();

  if (!apiKey) {
    logger.warn("OPENINARY_API_KEY is not set. Upload may fail.");
  }

  const form = new FormData();
  // Based on official docs: field name is 'files'
  form.append("files", buffer, { 
    filename: filename,
    contentType: mimetype || "image/jpeg"
  });

  // Add folder if provided
  if (folder) {
    form.append("folder", folder);
  }

  try {
    const response = await axios.post(`${baseUrl}/api/upload`, form, {
      headers: {
        ...form.getHeaders(),
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    return response.data;
  } catch (error) {
    logger.error("Openinary upload failed:", error.message);
    if (error.response) {
      logger.error("Status:", error.response.status);
    }
    throw new Error("Could not upload image to Openinary.");
  }
};

const deleteImage = async (publicId) => {
  const apiKey = (process.env.OPENINARY_API_KEY || "").trim();
  const baseUrl = (process.env.OPENINARY_URL || "http://localhost:3000").trim();

  try {
    await axios.delete(`${baseUrl}/api/media/${publicId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  } catch (error) {
    logger.error(
      "Openinary delete error:",
      error.response ? error.response.data : error.message
    );
    // We don't throw here if the image is already gone
  }
};

module.exports = { uploadImage, deleteImage };
