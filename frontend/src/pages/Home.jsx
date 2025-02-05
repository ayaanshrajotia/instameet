import { useEffect } from "react";
import { useSocket } from "../context/socket";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/chat";
import useMediaStream from "../hooks/useMediaStream";

function Home() {
    const { setName, setRoom, name, room } = useChat();
    const { socket } = useSocket();
    const { stream } = useMediaStream();

    const navigate = useNavigate();

    const handleSubmitForm = (e) => {
        e.preventDefault();

        socket.emit("join-room", { name, room });
        navigate(`/chat-room/${room}`);
    };

    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to server");
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
        };
    }, [socket]);

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl font-bold">Start instant video call</h1>
            <form
                onSubmit={handleSubmitForm}
                className="flex flex-col gap-4 mt-5"
            >
                <input
                    type="text"
                    className="px-4 py-2 rounded-xl w-[350px] h-[45px] outline-none bg-[#242A2E] border-2 border-[#30393e]"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="text"
                    className="px-4 py-2 rounded-xl w-[350px] h-[45px] outline-none bg-[#242A2E] border-2 border-[#30393e]"
                    placeholder="Room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={!name || !room}
                    className="bg-red-800 h-[45px] rounded-xl cursor-pointer px-4 py-2 text-white font-semibold"
                >
                    Join Chat
                </button>
            </form>
        </div>
    );
}

export default Home;
