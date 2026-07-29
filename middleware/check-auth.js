const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

const checkToken = (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  const JWT_TOKEN_KEY = process.env.JWT_TOKEN_KEY;
  const JWT_FALLBACK_KEYS = process.env.JWT_FALLBACK_KEYS
    ? process.env.JWT_FALLBACK_KEYS.split(",")
    : [];

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Authentication failed!");

    // "Bearer TOKEN" (Extract TOKEN with [1])
    const token = authHeader.split(" ")[1];

    // Check if token exist
    if (!token) throw new Error("Authentication failed!");

    // Verify token
    let decodedToken;
    let verificationError;

    try {
      decodedToken = jwt.verify(token, JWT_TOKEN_KEY);
    } catch (err) {
      verificationError = err;
      // Try fallback keys sequentially
      for (const fallbackKey of JWT_FALLBACK_KEYS) {
        try {
          decodedToken = jwt.verify(token, fallbackKey.trim());
          verificationError = null; // Cleared error
          break; // successfully verified
        } catch (e) {
          // Keep checking
        }
      }
    }

    if (verificationError) {
      throw verificationError;
    }

    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(
      new HttpError(`Authentication failed because of ${err.message}`, 403)
    );
  }
};

module.exports = checkToken;
