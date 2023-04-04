require("dotenv").config();
const logger = require("morgan");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// import routers
const productRouter = require("./routes/productRouter");
const sellerRouter = require("./routes/sellerRouter");

// instantiate an express server
const app = express();
app.use((req, res, next) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// add middleware for logging and parsing incoming data
app.use(logger("dev"));
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

// define the base URL
const baseUrl = process.env.BASE_URL;

// register routes
app.use(baseUrl + "/seller", sellerRouter);
app.use(baseUrl + "/product", productRouter);

// define a basic fallback route
app.use("/", (req, res) => {
  res.send("Hello, this is api for tackle net");
});

// export the app module
module.exports = app;
