// Importing required modules
const jwt = require("jsonwebtoken");

// Function to convert text into slug format
const convertToSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
};

// Modular function to send response for http server
const sendResponse = (res, status = 200, message = "", data = null, expire = false) => {
  // If expire flag is passed, include extra data in the response
  if (expire) {
    return res.status(status).json({
      message: message,
      ...data,
    });
  } else { // Otherwise, return the standard response
    return res.status(status).json({
      message: message,
      data: data,
    });
  }
};

// Middleware function to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // If no token is found, return unauthorized error
  if (token == null) return sendResponse(res, 401, "Unauthorized");

  // Verify the token and extract user information from it
  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err);
    // If verification fails, return unauthenticated error
    if (err) return sendResponse(res, 403, "Unauthenticated");
    // If verification succeeds, attach user information to request object and call next middleware
    req.username = user;
    next();
  });
};

// Exporting functions for external use
module.exports = {
  sendResponse,
  convertToSlug,
  authenticateToken,
};
