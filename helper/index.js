const jwt = require("jsonwebtoken");

// convert test to slug
const convertToSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
};

// modular function to send response for http server
const sendResponse = (res, status = 200, message = "", data = null, expire = false) => {
  if (expire) {
    return res.status(status).json({
      message: message,
      ...data,
    });
  } else {
    return res.status(status).json({
      message: message,
      data: data,
    });
  }
};

// authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return sendResponse(res, 401, "Unauthorized");

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err);
    if (err) return sendResponse(res, 403, "Unauthenticated");
    req.username = user;
    next();
  });
};

module.exports = {
  sendResponse,
  convertToSlug,
  authenticateToken,
};
