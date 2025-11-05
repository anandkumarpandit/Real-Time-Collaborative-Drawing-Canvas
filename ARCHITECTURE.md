# Architecture

Data flow

- Client captures pointer events -> batches points into "op" objects -> sends to server via Socket.io
- Server appends op to room history and broadcasts to all clients
- Clients render ops locally; on connect they request full ops list (init_state)

WebSocket protocol (message types)

- init_state: {ops: [...] } (server -> client)
- op: {id, userId, color, width, mode, points} (bidirectional, server rebroadcasts)
- remove_op: opId (server -> clients) when undo is invoked
- undo / redo: (client -> server)
- cursor: {userId, x, y, color, name} (client -> server -> others)
- users: [user] (server -> clients)

Undo/Redo Strategy

- Server maintains ordered op history (this.ops). Each op is a stroke.
- Undo: server pops last op and moves it onto redoStack; broadcasts remove_op with the removed op id.
- Redo: server pops from redoStack, re-appends to ops and broadcasts an op message.

Conflict resolution

- Server is authoritative for ordering: operations are applied in received order.
- Concurrent strokes are allowed; canvas is redrawn deterministically from ordered ops.

Performance decisions

- Clients send ops in small batches (every N points) for network efficiency and also send the final stroke to ensure completeness.
- Canvas rendering is optimized by redrawing only on op application; smoothing uses quadratic curves.

Future improvements

- Implement operation transforms or CRDT for richer undo semantics and concurrency correctness.
- Persist sessions to storage.
- Implement chunked history snapshots for faster join times.
