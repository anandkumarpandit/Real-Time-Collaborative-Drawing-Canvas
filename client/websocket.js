// websocket client wrapper using socket.io
(function (window) {
  class WSClient {
    constructor() {
      this.socket = io();
      this.handlers = {};
      this.socket.on("connect", () => {
        this.id = this.socket.id;
        this._emit("connected", this.id);
      });
      this.socket.on("init_state", (data) => this._emit("init_state", data));
      this.socket.on("op", (op) => this._emit("op", op));
      this.socket.on("remove_op", (id) => this._emit("remove_op", id));
      this.socket.on("users", (users) => this._emit("users", users));
      this.socket.on("cursor", (c) => this._emit("cursor", c));
    }

    on(name, cb) {
      this.handlers[name] = this.handlers[name] || [];
      this.handlers[name].push(cb);
    }
    _emit(name, data) {
      (this.handlers[name] || []).forEach((cb) => cb(data));
    }

    sendOp(op) {
      this.socket.emit("op", op);
    }
    sendCursor(cursor) {
      this.socket.emit("cursor", cursor);
    }
    sendUndo() {
      this.socket.emit("undo");
    }
    sendRedo() {
      this.socket.emit("redo");
    }
  }

  window.WSClient = WSClient;
})(window);
