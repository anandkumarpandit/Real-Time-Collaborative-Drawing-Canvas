# Collaborative Canvas

Simple real-time collaborative drawing canvas using vanilla JS + Node.js + Socket.io.

Setup

1. cd collaborative-canvas
2. npm install
3. npm start

Open multiple browser windows to http://localhost:3000 to test multiple users.

Notes / Known limitations

- Undo/Redo is global LIFO across all users (server pops last op). This is simple but may be surprising if you expected per-user undo.
- No authentication, no persistence; everything is in-memory.
- No sophisticated OT/CRDT: ops are applied in server order.

Time spent: ~2 hours to scaffold and implement prototype.
