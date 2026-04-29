const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

const checkToken = (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  const JWT_TOKEN_KEY = process.env.JWT_TOKEN_KEY;

  try {
    // "Bearer TOKEN" (Extract TOKEN with [1])
    const token = req.headers.authorization.split(" ")[1];

    // Check if token exist
    if (!token) throw new Error("Authentication failed!");

    // Verify token
    const decodedToken = jwt.verify(token, JWT_TOKEN_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(
      new HttpError(`Authentication failed because of ${err.message}`, 403)
    );
  }
};

module.exports = checkToken;
