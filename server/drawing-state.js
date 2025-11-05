// Simple operation history for strokes with undo/redo
class DrawingState {
  constructor() {
    this.ops = []; // applied ops
    this.redoStack = []; // undone ops that can be redone
  }

  getOps() {
    return this.ops.slice();
  }

  addOp(op) {
    // adding new op clears redo stack
    this.ops.push(op);
    this.redoStack = [];
  }

  popOp() {
    if (this.ops.length === 0) return null;
    const op = this.ops.pop();
    this.redoStack.push(op);
    return op;
  }

  redoOp() {
    if (this.redoStack.length === 0) return null;
    const op = this.redoStack.pop();
    this.ops.push(op);
    return op;
  }
}

module.exports = DrawingState;
