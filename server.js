// PATCH: server.js (replace your current server.js with this)
// server.js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("❌ Error occurred handling request", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    path: "/api/socket",
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Track rooms explicitly to avoid adapter timing races
  const rooms = new Map(); // roomId -> Set(socketId)

  function getMembers(roomId) {
    const s = rooms.get(roomId);
    return s ? Array.from(s) : [];
  }

  function broadcastRoomState(roomId) {
    const members = getMembers(roomId);
    io.to(roomId).emit("room-state", { roomId, members });
    console.log(`📡 room-state [${roomId}] ->`, members);
  }

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("join-room", (roomId) => {
      try {
        if (!roomId) return;
        socket.join(roomId);

        if (!rooms.has(roomId)) rooms.set(roomId, new Set());
        rooms.get(roomId).add(socket.id);

        const members = getMembers(roomId);
        console.log(`👤 ${socket.id} joined room ${roomId} — members:`, members);

        // Inform the joining socket who is already in the room
        const existingUserIds = members.filter((id) => id !== socket.id);
        socket.emit("existing-users", { roomSize: existingUserIds.length, existingUserIds });

        // Broadcast full room state for deterministic role locking
        broadcastRoomState(roomId);

        // Notify others of the join
        existingUserIds.forEach((otherId) => {
          socket.to(otherId).emit("user-joined", { userId: socket.id, roomSize: members.length });
        });

        // If a second participant joined, instruct the existing peer to initiate the offer
        if (existingUserIds.length === 1) {
          const existingId = existingUserIds[0];
          console.log(`➡️ Asking existing peer ${existingId} to initiate offer in room ${roomId}`);
          io.to(existingId).emit("initiate-offer", { roomId });
        }
      } catch (err) {
        console.error("join-room error:", err);
      }
    });

    // Forward offer to all other members in the room (explicitly)
    socket.on("offer", (data) => {
      try {
        const { offer, roomId } = data || {};
        if (!roomId || !offer) return;
        const members = getMembers(roomId);
        console.log(`📨 Offer from ${socket.id} in ${roomId} -> forwarding to:`, members.filter(id => id !== socket.id));
        members.forEach((otherId) => {
          if (otherId === socket.id) return;
          io.to(otherId).emit("offer", { offer, senderId: socket.id });
        });
      } catch (err) {
        console.error("offer forward error:", err);
      }
    });

    socket.on("answer", (data) => {
      try {
        const { answer, roomId } = data || {};
        if (!roomId || !answer) return;
        const members = getMembers(roomId);
        console.log(`📨 Answer from ${socket.id} in ${roomId} -> forwarding to:`, members.filter(id => id !== socket.id));
        members.forEach((otherId) => {
          if (otherId === socket.id) return;
          io.to(otherId).emit("answer", { answer, senderId: socket.id });
        });
      } catch (err) {
        console.error("answer forward error:", err);
      }
    });

    socket.on("ice-candidate", (data) => {
      try {
        const { candidate, roomId } = data || {};
        if (!roomId || !candidate) return;
        const members = getMembers(roomId);
        // forward ICE candidate to all other members
        members.forEach((otherId) => {
          if (otherId === socket.id) return;
          io.to(otherId).emit("ice-candidate", { candidate, senderId: socket.id });
        });
      } catch (err) {
        console.error("ice-candidate forward error:", err);
      }
    });

    socket.on("code-change", (data) => {
      try {
        const { change, roomId } = data || {};
        if (!roomId) return;
        const members = getMembers(roomId);
        members.forEach((otherId) => {
          if (otherId === socket.id) return;
          io.to(otherId).emit("code-change", { change, senderId: socket.id });
        });
      } catch (err) {
        console.error("code-change forward error:", err);
      }
    });

    socket.on("end-interview", ({ roomId }) => {
      try {
        if (!roomId) return;
        io.to(roomId).emit("interview-ended");
        console.log(`🛑 Interview ended by ${socket.id} in room ${roomId}`);
      } catch (err) {
        console.error("end-interview error:", err);
      }
    });

    // Handle leaving rooms when socket disconnects
    socket.on("disconnecting", () => {
      try {
        for (const roomId of socket.rooms) {
          if (roomId === socket.id) continue; // skip personal room
          const members = rooms.get(roomId);
          if (members) {
            members.delete(socket.id);
            if (members.size === 0) rooms.delete(roomId);
            else rooms.set(roomId, members);
            // broadcast updated state
            broadcastRoomState(roomId);
            socket.to(roomId).emit("user-left", { userId: socket.id });
            console.log(`🚪 ${socket.id} leaving room ${roomId}`);
          }
        }
      } catch (err) {
        console.error("disconnecting error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
      // safety: ensure socket isn't left in any room map
      for (const [roomId, members] of rooms.entries()) {
        if (members.has(socket.id)) {
          members.delete(socket.id);
          if (members.size === 0) rooms.delete(roomId);
          else rooms.set(roomId, members);
          io.to(roomId).emit("room-state", { roomId, members: Array.from(members) });
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`🚀 Server ready at http://${hostname}:${port}`);
  });
});

