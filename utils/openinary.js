const axios = require("axios");
const FormData = require("form-data");
const logger = require("./logger");

const uploadImage = async (buffer, filename, mimetype) => {
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

  logger.info("Openinary Upload Debug:", {
    url: `${baseUrl}/upload`,
    apiKeyExists: !!apiKey,
    bufferSize: buffer ? buffer.length : 0,
    filename,
    mimetype
  });

  try {
    const response = await axios.post(`${baseUrl}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    return response.data;
  } catch (error) {
    logger.error("Openinary upload FAILED. Full Error Info:", {
      message: error.message,
      code: error.code,
      status: error.response ? error.response.status : "NO_RESPONSE",
      data: error.response ? error.response.data : "NO_DATA",
      stack: error.stack
    });
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
