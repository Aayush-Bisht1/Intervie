// This file should be in the root directory
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
            origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        },
        path: '/api/socket'
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            const room = io.sockets.adapter.rooms.get(roomId);
            const numUsers = room ? room.size : 0;
            
            console.log(`Socket ${socket.id} joined room ${roomId} (${numUsers} users in room)`);
            
            // Get all sockets in the room
            const socketsInRoom = Array.from(room || []);
            
            // Notify others in the room that a new user joined
            socket.to(roomId).emit('user-joined', {
                userId: socket.id,
                roomSize: numUsers
            });
            
            // Notify the joining user about existing users
            if (numUsers > 1) {
                // Wait a bit to ensure the socket is fully joined
                setTimeout(() => {
                    socket.emit('existing-users', {
                        roomSize: numUsers - 1,
                        existingUserIds: socketsInRoom.filter(id => id !== socket.id)
                    });
                }, 100);
            }
        });

        socket.on('offer', (data) => {
            socket.to(data.roomId).emit('offer', {
                offer: data.offer,
                senderId: socket.id
            });
        });

        socket.on('answer', (data) => {
            socket.to(data.roomId).emit('answer', {
                answer: data.answer,
                senderId: socket.id
            });
        });

        socket.on('ice-candidate', (data) => {
            socket.to(data.roomId).emit('ice-candidate', {
                candidate: data.candidate,
                senderId: socket.id
            });
        });

        socket.on('code-change', (data) => {
            socket.to(data.roomId).emit('code-change', {
                change: data.change,
                senderId: socket.id
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
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