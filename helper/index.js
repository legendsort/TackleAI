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

module.exports = {
  sendResponse,
  convertToSlug,
};
