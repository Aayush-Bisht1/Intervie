// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/api/socket',
    // optional: tighten heartbeat if you see ghost sockets
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // helper: broadcast the current room membership (sorted) to everyone in the room
  function broadcastRoomState(roomId) {
    const room = io.sockets.adapter.rooms.get(roomId) || new Set();
    const members = Array.from(room).sort();
    io.to(roomId).emit('room-state', { roomId, members }); // authoritative list for role locking
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (roomId) => {
      const roomBefore = io.sockets.adapter.rooms.get(roomId) || new Set();
      if (roomBefore.size >= 2) {
        // optional hard cap; avoids 3rd participant breaking 1:1 logic
        socket.emit('room-full', { roomId });
        return;
      }

      socket.join(roomId);

      const room = io.sockets.adapter.rooms.get(roomId) || new Set();
      const ids = Array.from(room);

      console.log(`Socket ${socket.id} joined room ${roomId} (${ids.length} users)`);

      // Tell everyone the latest membership (sorted)
      broadcastRoomState(roomId);

      // Notify others that someone joined (legacy event still useful for logs)
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        roomSize: ids.length,
      });

      // Also tell the joiner who is already there (legacy path)
      // (kept for backward-compat with your client; now redundant with room-state)
      socket.emit('existing-users', {
        roomSize: Math.max(0, ids.length - 1),
        existingUserIds: ids.filter((id) => id !== socket.id),
      });
    });

    // WebRTC signaling (1:1)
    socket.on('offer', (data) => {
      socket.to(data.roomId).emit('offer', { offer: data.offer, senderId: socket.id });
    });

    socket.on('answer', (data) => {
      socket.to(data.roomId).emit('answer', { answer: data.answer, senderId: socket.id });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.roomId).emit('ice-candidate', { candidate: data.candidate, senderId: socket.id });
    });

    // Code sync passthrough
    socket.on('code-change', (data) => {
      socket.to(data.roomId).emit('code-change', { change: data.change, senderId: socket.id });
    });

    // End interview for all
    socket.on('end-interview', ({ roomId }) => {
      socket.to(roomId).emit('interview-ended');
      socket.emit('interview-ended');
    });

    socket.on('disconnecting', () => {
      // notify each room this socket is leaving so peers can cleanup
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;
        socket.to(roomId).emit('user-left', { userId: socket.id });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // After disconnect, rooms are gone; if you track active rooms, rebroadcast here as needed
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
