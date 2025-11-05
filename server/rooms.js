const DrawingState = require("./drawing-state");

class Room {
  constructor(name) {
    this.name = name;
    this.users = {};
    this.state = new DrawingState();
  }
  join(user) {
    this.users[user.id] = user;
  }
  leave(id) {
    delete this.users[id];
  }
  getUsers() {
    return Object.values(this.users);
  }
}

class Rooms {
  constructor() {
    this.map = {};
  }
  getRoom(name) {
    if (!this.map[name]) this.map[name] = new Room(name);
    return this.map[name];
  }
}

module.exports = Rooms;
