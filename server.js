const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { Server } = require("socket.io");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

io.on("connection", (socket) => {
  console.log("connected...");
  socket.on("disconnect", () => {
    console.log("disconnected...");
  });
});

const PORT = 8088;
server.listen(PORT, () => {
  console.log("server is running on port " + PORT);
});

const PORT_ARDUINO = new SerialPort({
  path: "COM7",
  baudRate: 19200,
});

const parser = PORT_ARDUINO.pipe(new ReadlineParser({ delimiter: "\r\n" }));

parser.on("data", (result) => {
  console.log("data dari arduion -> ", result);
  io.emit("data", { data: result });
});

app.post("/arduinoApi", (req, res) => {
  const data = req.body.data;

  parser.emit("data", data);
  PORT_ARDUINO.write(data, (error) => {
    if (error) {
      console.log("error -> ", error);
      res.status(500).json({ message: error });
    }
    console.log("success : ", data);
    res.status(200).json({ message: "success" });
  });
});
