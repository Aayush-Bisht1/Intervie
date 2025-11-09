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

        socket.on('join-room', (roomId: string) => {
            socket.join(roomId);
            socket.to(roomId).emit('user-joined', socket.id);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        socket.on('offer', (data: { offer: any; roomId: string }) => {
            socket.to(data.roomId).emit('offer', {
                offer: data.offer,
                senderId: socket.id
            });
        });

        socket.on('answer', (data: { answer: any; roomId: string }) => {
            socket.to(data.roomId).emit('answer', {
                answer: data.answer,
                senderId: socket.id
            });
        });

        socket.on('ice-candidate', (data: { candidate: any; roomId: string }) => {
            socket.to(data.roomId).emit('ice-candidate', {
                candidate: data.candidate,
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