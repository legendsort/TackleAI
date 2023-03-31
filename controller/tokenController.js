const jwt = require("jsonwebtoken");
const {sendResponse} = require("../helper");

// Function to generate a JWT token based on the provided username
const generateAccessToken = (username) => {
  try {
    // Create a token using the provided username and token secret from environment variables
    const token = jwt.sign({username}, process.env.TOKEN_SECRET);
    // Return the token as part of a data object
    return {
      data: token,
      error: null,
    };
  } catch (e) {
    // If an error occurs during token generation, return the error as part of the data object
    return {
      data: null,
      error: e,
    };
  }
};

// Exported object containing a function to generate a JWT token
module.exports = {
  // Function to get a JWT token based on the provided username query parameter
  getToken: (req, res) => {
    // Get the username from the query parameter
    const {username} = req.query;
    // Generate a token based on the provided username
    const {data, error} = generateAccessToken(username);

    // If an error occurred during token generation, send an error response
    if (error) return sendResponse(res, 500, error, data);
    // If successful, send a success response with the generated token
    return sendResponse(res, 200, "Successfully get jwt token", data);
  },
};
