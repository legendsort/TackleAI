const jwt = require("jsonwebtoken");
const {sendResponse} = require("../helper");

const generateAccessToken = (username) => {
  try {
    const token = jwt.sign({username}, process.env.TOKEN_SECRET, {expiresIn: "1800s"});
    return {
      data: token,
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: e,
    };
  }
};

module.exports = {
  getToken: (req, res) => {
    const {username} = req.query;
    const {data, error} = generateAccessToken(username);

    if (error) return sendResponse(res, 500, error, data);
    return sendResponse(res, 200, "Successfully get jwt token", data);
  },
};
