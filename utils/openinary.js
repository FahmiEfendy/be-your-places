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
    url: `${baseUrl}/api/upload`,
    apiKeyExists: !!apiKey,
    bufferSize: buffer ? buffer.length : 0,
    filename,
    mimetype
  });

  logger.info("DEBUG: About to send request to Openinary...");

  try {
    const response = await axios.post(`${baseUrl}/api/upload`, form, {
      headers: {
        ...form.getHeaders(),
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    logger.info("DEBUG: Openinary response received!");
    return response.data;
  } catch (error) {
    logger.info("DEBUG: CATCH block triggered!");
    logger.error("DEBUG: Error Message:", error.message);
    if (error.response) {
      logger.error("DEBUG: Status Code:", error.response.status);
      logger.error("DEBUG: Response Data:", JSON.stringify(error.response.data));
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
