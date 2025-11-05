const path = require("path");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const Rooms = require("./rooms");

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "..", "client")));

const rooms = new Rooms();

io.on("connection", (socket) => {
  const user = { id: socket.id, name: null, color: randomColor() };
  const room = rooms.getRoom("main");
  room.join(user);

  // send initial drawing state
  socket.emit("init_state", { ops: room.state.getOps() });
  io.emit("users", room.getUsers());

  socket.on("op", (op) => {
    // receive op from client -> append to room history -> broadcast
    room.state.addOp(op);
    io.emit("op", op);
  });

  socket.on("undo", () => {
    const removed = room.state.popOp();
    if (removed) io.emit("remove_op", removed.id);
  });

  socket.on("redo", () => {
    const re = room.state.redoOp();
    if (re) io.emit("op", re);
  });

  socket.on("cursor", (c) => {
    c.userId = socket.id;
    c.name = user.name;
    c.color = user.color;
    socket.broadcast.emit("cursor", c);
  });

  socket.on("disconnect", () => {
    room.leave(user.id);
    io.emit("users", room.getUsers());
  });
});

http.listen(PORT, () => console.log("Server listening on", PORT));

function randomColor() {
  const h = Math.floor(Math.random() * 360);
  return `hsl(${h} 70% 40%)`;
}
