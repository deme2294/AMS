const { Server } = require("socket.io");

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    const roomViewers = new Map();

    io.on("connection", (socket) => {
        console.log("New socket connection:", socket.id);

        socket.on("join-event", ({ eventId, username }) => {
            socket.join(`event-${eventId}`);
            socket.data.eventId = eventId;
            socket.data.username = username || `Guest-${socket.id.substring(0, 4)}`;

            // Update viewer count
            const currentCount = io.sockets.adapter.rooms.get(`event-${eventId}`)?.size || 0;
            io.to(`event-${eventId}`).emit("viewer-count", currentCount);

            console.log(`${socket.data.username} joined event ${eventId}. Total viewers: ${currentCount}`);
        });

        socket.on("send-message", ({ eventId, text }) => {
            const message = {
                id: Math.random().toString(36).substr(2, 9),
                author: socket.data.username,
                text,
                timestamp: new Date().toISOString()
            };

            io.to(`event-${eventId}`).emit("new-message", message);
        });

        socket.on("disconnect", () => {
            const eventId = socket.data.eventId;
            if (eventId) {
                const currentCount = io.sockets.adapter.rooms.get(`event-${eventId}`)?.size || 0;
                io.to(`event-${eventId}`).emit("viewer-count", currentCount);
            }
            console.log("Socket disconnected:", socket.id);
        });
    });

    return io;
};

module.exports = setupSocket;
