const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

app.use(express.static(__dirname + "/public"));

const io = require("socket.io")(server);
require('./src/socketConnection.js')(io);

const port = process.env.PORT || 9000;
server.listen(port, () => console.log(`Server is running on port ${port}`));