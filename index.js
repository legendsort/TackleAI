require("dotenv").config();
const http = require("http");
const debug = require("debug")("genux-service:server");

const app = require("./app");
const port = parseInt(process.env.PORT || "3000", 10);

app.set("port", port);

//create server
const server = http.createServer(app);

const onError = (error) => {
  if (error.syscall !== "listen") throw error;
  const bind = "Port " + port;

  // handle specific listening errors with messages
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
  debug("Listening on Port: ", port);
};
// Listen on provided port, on all network interfaces.
server.listen(port, () => {
  const address = server.address();
  console.log("Server is running on port ", port);
});
server.on("error", onError);
server.on("listening", onListening);

module.exports = app;
