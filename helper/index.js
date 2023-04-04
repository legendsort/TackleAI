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
  } else {
    // Otherwise, return the standard response
    return res.status(status).json({
      message: message,
      data: data,
    });
  }
};

// Exporting functions for external use
module.exports = {
  sendResponse,
  convertToSlug,
};
