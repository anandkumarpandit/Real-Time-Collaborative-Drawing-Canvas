// App wiring: handle UI, mouse/touch events, batching & sending ops
(function () {
  const canvasEl = document.getElementById("canvas");
  const dc = new DrawingCanvas(canvasEl);
  const ws = new WSClient();

  // UI elements
  const brushBtn = document.getElementById("brush");
  const eraserBtn = document.getElementById("eraser");
  const colorInp = document.getElementById("color");
  const widthInp = document.getElementById("width");
  const undoBtn = document.getElementById("undo");
  const redoBtn = document.getElementById("redo");
  const userList = document.getElementById("user-list");

  let tool = "brush";
  brushBtn.onclick = () => {
    tool = "brush";
    brushBtn.classList.add("active");
    eraserBtn.classList.remove("active");
  };
  eraserBtn.onclick = () => {
    tool = "erase";
    eraserBtn.classList.add("active");
    brushBtn.classList.remove("active");
  };

  undoBtn.onclick = () => ws.sendUndo();
  redoBtn.onclick = () => ws.sendRedo();

  // remote users
  const remoteCursors = {};

  ws.on("users", (users) => {
    userList.textContent = users.map((u) => u.name || u.id).join(", ");
  });

  ws.on("init_state", (data) => {
    dc.setOps(data.ops || []);
  });

  ws.on("op", (op) => dc.addOp(op));
  ws.on("remove_op", (id) => dc.removeOpById(id));

  ws.on("cursor", (c) => {
    // show simple colored dot at remote cursor
    const id = c.userId;
    let el = remoteCursors[id];
    if (!el) {
      el = document.createElement("div");
      el.className = "remote-cursor";
      el.style.background = c.color || "red";
      el.title = c.name || id;
      document.getElementById("canvas-wrap").appendChild(el);
      remoteCursors[id] = el;
    }
    el.style.left = c.x + "px";
    el.style.top = c.y + "px";
  });

  // drawing capture & batching
  let drawing = false;
  let currentPoints = [];
  let currentId = null;

  function getPointer(e) {
    const rect = canvasEl.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  }

  function beginPoint(pt) {
    drawing = true;
    currentPoints = [pt];
    currentId =
      "op_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    // optimistic draw locally
    dc.addOp({
      id: currentId,
      userId: ws.id,
      color: colorInp.value,
      width: parseInt(widthInp.value),
      mode: tool === "erase" ? "erase" : "draw",
      points: currentPoints.slice(),
    });
  }

  function movePoint(pt) {
    if (!drawing) return;
    currentPoints.push(pt);
    // update last op locally for responsiveness by removing and re-adding
    dc.removeOpById(currentId);
    dc.addOp({
      id: currentId,
      userId: ws.id,
      color: colorInp.value,
      width: parseInt(widthInp.value),
      mode: tool === "erase" ? "erase" : "draw",
      points: currentPoints.slice(),
    });
    // send incremental batches occasionally
    if (currentPoints.length % 6 === 0) {
      ws.sendOp({
        id: currentId,
        userId: ws.id,
        color: colorInp.value,
        width: parseInt(widthInp.value),
        mode: tool === "erase" ? "erase" : "draw",
        points: currentPoints.slice(),
      });
    }
  }

  function endPoint() {
    if (!drawing) return;
    drawing = false;
    // final send
    ws.sendOp({
      id: currentId,
      userId: ws.id,
      color: colorInp.value,
      width: parseInt(widthInp.value),
      mode: tool === "erase" ? "erase" : "draw",
      points: currentPoints.slice(),
    });
    currentPoints = [];
    currentId = null;
  }

  // pointer events
  canvasEl.addEventListener("pointerdown", (e) => {
    canvasEl.setPointerCapture(e.pointerId);
    beginPoint(getPointer(e));
  });
  canvasEl.addEventListener("pointermove", (e) => {
    ws.sendCursor({
      userId: ws.id,
      x: getPointer(e).x,
      y: getPointer(e).y,
      color: colorInp.value,
    });
    movePoint(getPointer(e));
  });
  window.addEventListener("pointerup", (e) => {
    endPoint();
  });

  // touch fallbacks
  canvasEl.addEventListener("touchstart", (e) => {
    beginPoint(getPointer(e));
    e.preventDefault();
  });
  canvasEl.addEventListener("touchmove", (e) => {
    movePoint(getPointer(e));
    e.preventDefault();
  });
  canvasEl.addEventListener("touchend", (e) => {
    endPoint();
    e.preventDefault();
  });

  // resize canvas element to fill
  function fitCanvasSize() {
    const wrap = document.getElementById("canvas-wrap");
    canvasEl.style.width = "100%";
    canvasEl.style.height = "100%";
    dc.resize();
  }
  window.addEventListener("load", fitCanvasSize);
  window.addEventListener("resize", fitCanvasSize);

  // helpers: keyboard undo/redo
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") ws.sendUndo();
    if ((e.ctrlKey || e.metaKey) && e.key === "y") ws.sendRedo();
  });
})();
