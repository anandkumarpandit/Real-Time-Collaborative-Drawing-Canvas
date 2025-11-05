// Minimal canvas drawing helper (vanilla JS)
(function (window) {
  class DrawingCanvas {
    constructor(canvasEl) {
      this.canvas = canvasEl;
      this.ctx = this.canvas.getContext("2d");
      this.ops = []; // ordered list of strokes (server authoritative)
      this.pixelRatio = window.devicePixelRatio || 1;
      this.resize();
      window.addEventListener("resize", () => this.resize());
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = Math.round(rect.width * this.pixelRatio);
      this.canvas.height = Math.round(rect.height * this.pixelRatio);
      this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      this.redraw();
    }

    addOp(op) {
      // op: {id, userId, color, width, mode, points: [{x,y}, ...]}
      this.ops.push(op);
      this.drawStroke(op);
    }

    removeOpById(id) {
      this.ops = this.ops.filter((o) => o.id !== id);
      this.redraw();
    }

    setOps(list) {
      this.ops = list.slice();
      this.redraw();
    }

    redraw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const op of this.ops) this.drawStroke(op);
    }

    drawStroke(op) {
      const ctx = this.ctx;
      if (!op.points || op.points.length === 0) return;
      ctx.save();
      if (op.mode === "erase") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = op.color || "#000";
      ctx.lineWidth = op.width || 4;

      // smoothing via quadratic curves between midpoints
      const pts = op.points;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const cur = pts[i];
        const cx = (prev.x + cur.x) / 2;
        const cy = (prev.y + cur.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
      }
      // last line to final point
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  window.DrawingCanvas = DrawingCanvas;
})(window);
