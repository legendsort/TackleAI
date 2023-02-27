require("dotenv").config();
const cors = require("cors");
const logger = require("morgan");
const jwt = require("express-jwt");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const productRouter = require("./routes/productRouter");
const sellerRouter = require("./routes/sellerRouter");
const tokenRouter = require("./routes/tokenRouter");

// express settings
const app = express();
app.use(logger("dev"));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(bodyParser.json({limit: "50mb"}));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 5000,
  })
);

// register route
const baseUrl = process.env.BASE_URL;
app.use(baseUrl + "/seller", sellerRouter);
app.use(baseUrl + "/product", productRouter);
app.use(baseUrl + "/token", tokenRouter);

app.use("/", (req, res) => {
  res.send("Hello, this is api for tackle net");
});
module.exports = app;
