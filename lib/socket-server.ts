import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeSocket(server: HTTPServer) {
    if (io) return io;

    io = new SocketIOServer(server, {
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

        socket.on('offer', (data: { offer: RTCSessionDescriptionInit; roomId: string }) => {
            socket.to(data.roomId).emit('offer', {
                offer: data.offer,
                senderId: socket.id
            });
        });

        socket.on('answer', (data: { answer: RTCSessionDescriptionInit; roomId: string }) => {
            socket.to(data.roomId).emit('answer', {
                answer: data.answer,
                senderId: socket.id
            });
        });

        socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit; roomId: string }) => {
            socket.to(data.roomId).emit('ice-candidate', {
                candidate: data.candidate,
                senderId: socket.id
            });
        });

        socket.on('code-change', (data: { roomId: string; change: any }) => {
            socket.to(data.roomId).emit('code-change', data.change);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}