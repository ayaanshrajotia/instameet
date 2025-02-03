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

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-chat", ({ roomId, id, name }) => {
        console.log(`${name} with ${id} joined room ${roomId}`);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", { name, id });
    });

    socket.on("leave-chat", ({ roomId, id }) => {
        console.log(`User ${id} left room ${roomId}`);
        socket.leave(roomId);
        socket.broadcast.to(roomId).emit("user-leaves", id);
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

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(process.env.PORT, () => {
    console.log("Server is running on port ", process.env.PORT);
});
