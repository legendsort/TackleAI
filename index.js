require("dotenv").config();
const http = require("http");
const debug = require("debug")("genux-service:server");

//import the app module
const app = require("./app");

//set the port for the server
const port = parseInt(process.env.PORT || "3000", 10);

//set port for the app to listen on
app.set("port", port);

//create server with set timeout limit
const server = http.createServer(app);
const timeout = process.env.TIME_OUT * 60 * 1000;
server.setTimeout(timeout);

//function to handle errors related to the server connection
const onError = (error) => {
  if (error.syscall !== "listen") throw error;

  //determine which specific error occurred and log message accordingly
  const bind = "Port " + port;
  switch (error.code) {
    case "EACCESS":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + "is already in use");
      process.exit(1);
    default:
      throw error;
  }
};
const onListening = () => {
  const address = server.address();

  //log the port that the server is listening on
  debug("Listening on Port: ", port);
};

//listen on the specified port
server.listen(port, () => {
  const address = server.address();

  //log a message when the server has been successfully started
  console.log("Server is running on port ", port);
});

//listen for any errors or successful connections
server.on("error", onError);
server.on("listening", onListening);

//export the app module
module.exports = app;
