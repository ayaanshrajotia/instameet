import { useEffect } from "react";
import { useSocket } from "../context/socket";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/chat";
import useMediaStream from "../hooks/useMediaStream";
import toast from "react-hot-toast";
import { v4 as uuid } from "uuid";

function Home() {
    const { setName, setRoom, name, room } = useChat();
    const { socket } = useSocket();

    const { stream } = useMediaStream();

    const navigate = useNavigate();

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (!name) {
            toast.error("Name is required");
            return;
        }

        if (!room) {
            toast.error("Room ID is required");
            return;
        }

        socket.emit("join-room", { name, room });
        navigate(`/chat-room/${room}`);
    };

    const handleCreateRoom = (e) => {
        e.preventDefault();
        if (!name) {
            toast.error("Name is required");
            return;
        }
        const id = uuid();
        setRoom(id);
        socket.emit("join-room", { name, room: id });
        navigate(`/chat-room/${id}`);
    };

    useEffect(() => {
        socket.on("connect", () => {
            // console.log("Connected to server");
        });

        socket.on("disconnect", () => {
            // console.log("Disconnected from server");
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
        };
    }, [socket]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="flex flex-col items-center gap-2">
                <h1 className="website-head text-5xl font-extrabold">
                    InstaMeet
                </h1>
                <p className="text-center text-gray-400">
                    Instant, seamless, and high-quality video calls with just
                    one click. Stay connected with friends and family anytime,
                    anywhere!
                </p>
            </div>
            <form
                onSubmit={handleJoinRoom}
                className="flex flex-col gap-4 mt-8 max-w-[350px] w-full items-center"
            >
                <input
                    type="text"
                    className="px-4 py-2 rounded-xl w-full h-[45px] outline-none bg-[#242A2E] border-2 border-[#30393e]"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="text"
                    className="px-4 py-2 rounded-xl w-full h-[45px] outline-none bg-[#242A2E] border-2 border-[#30393e]"
                    placeholder="Room ID"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                />
                <button
                    type="submit"
                    className="bg-red-800 h-[45px] w-full rounded-xl cursor-pointer px-4 py-2 text-white font-semibold"
                >
                    Join Room
                </button>
                <span className="text-center text-gray-400">OR</span>
                <button
                    className="bg-gray-200 text-gray-800 w-full h-[45px] rounded-xl cursor-pointer px-4 py-2 font-semibold"
                    onClick={handleCreateRoom}
                >
                    Create New Room
                </button>
            </form>
        </div>
    );
}

export default Home;
