import express from "express";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const __dirname = path.resolve();

const app = express();
const server = http.createServer(app);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

const socketIdToPeerId = new Map();

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ✅ Emit join chat event
    socket.on("join-chat", ({ roomId, id, name }) => {
        socketIdToPeerId.set(socket.id, id);
        console.log("map:", socketIdToPeerId.get(socket.id));
        console.log(`${name} with ${id} joined room ${roomId}`);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", { name, id });
    });

    // ✅ Emit mic toggle event
    socket.on("toggle-mic", ({ roomId, userId, muted }) => {
        console.log(
            `User ${userId} toggled mic to ${muted ? "muted" : "unmuted"}`
        );
        socket.broadcast.to(roomId).emit("toggle-mic", { userId, muted });
    });

    // ✅ Emit video toggle event
    socket.on("toggle-video", ({ roomId, userId, video }) => {
        console.log(
            `User ${userId} toggled video to ${video ? "enabled" : "disabled"}`
        );
        socket.broadcast.to(roomId).emit("toggle-video", { userId, video });
    });

    // ✅ Emit send message event
    socket.on("send-message", ({ roomId, name, message }) => {
        console.log(`${name} in ${roomId}:`, message);
        io.to(roomId).emit("receive-message", { name, message });
    });

    // ✅ Emit leave chat event
    socket.on("leave-chat", ({ roomId, id }) => {
        console.log(`User ${id} left room ${roomId}`);
        socket.leave(roomId);
        socket.broadcast.to(roomId).emit("user-leaves", id);
        socketIdToPeerId.delete(socket.id); // Remove user from map
    });

    // ✅ Emit chat message event
    socket.on("disconnect", () => {
        const peerId = socketIdToPeerId.get(socket.id);
        if (peerId) {
            socket.broadcast.emit("user-leaves", peerId);
            socketIdToPeerId.delete(socket.id);
        }
        console.log("User disconnected:", peerId);
    });
});

server.listen(process.env.PORT, () => {
    console.log("Server is running on port ", process.env.PORT);
});
