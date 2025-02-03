import { useEffect, useState, useRef } from "react";
import Peer from "peerjs";
import ReactPlayer from "react-player";
import useMediaStream from "../hooks/useMediaStream";
import { useSocket } from "../context/socket";
import {
    MessageSquareText,
    Mic,
    MicOff,
    Phone,
    Users,
    Video,
    VideoOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/chat";
import PlayerSkeleton from "../../components/PlayerSkeleton";
import PlayerSkeletonUser from "../../components/PlayerSkeletonUser";
import { capitalizaFirstLetter } from "../libs/utils";

function ChatRoom() {
    const { name, room: roomId } = useChat();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [myId, setMyId] = useState("");
    const [connectedPeers, setConnectedPeers] = useState([]);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);

    const { stream } = useMediaStream();

    const peerRef = useRef(null);
    if (!peerRef.current) {
        peerRef.current = new Peer();
    }
    const peer = peerRef.current;

    useEffect(() => {
        if (!name) {
            socket.emit("leave-chat", { roomId, id: myId });
            setConnectedPeers([]);
            navigate("/");
        }
    }, [myId, name, navigate, roomId, socket]);

    // Connect to the peer server
    useEffect(() => {
        peer.on("open", (id) => {
            console.log("My peer ID is:", id);
            setMyId(id);

            // ✅ Prevent duplicate self-addition
            setConnectedPeers((prevPeers) => {
                if (prevPeers.some((peer) => peer.id === id)) return prevPeers;
                return [
                    ...prevPeers,
                    { id, stream, name, self: true, muted: false, video: true },
                ];
            });

            socket.emit("join-chat", { roomId: roomId, id, name });
        });

        return () => {
            peer.off("open");
        };
    }, [name, peer, roomId, socket, stream]);

    // Calls the new user when they join the chat with our stream
    useEffect(() => {
        if (!stream) return;
        const handleUserConnected = ({ name: newUserName, id: newUserId }) => {
            console.log("User connected:", newUserName, newUserId);

            // ✅ Call the new user and send your name in metadata
            const call = peer.call(newUserId, stream, { metadata: { name } });

            call.on("stream", (incomingStream) => {
                console.log(
                    `Incoming stream from ${newUserId} (${newUserName})`
                );

                setConnectedPeers((prevPeers) => {
                    if (prevPeers.some((peer) => peer.id === newUserId))
                        return prevPeers;
                    return [
                        ...prevPeers,
                        {
                            id: newUserId,
                            stream: incomingStream,
                            name: newUserName,
                            muted: false,
                            video: true,
                        },
                    ];
                });
            });
        };

        socket.on("user-connected", handleUserConnected);

        return () => socket.off("user-connected", handleUserConnected);
    }, [connectedPeers, name, peer, socket, stream]);

    // Answer the call and set the peer stream
    useEffect(() => {
        if (!stream) return;
        peer.on("call", (call) => {
            const { peer: callerId, metadata } = call;
            const callerName = metadata.name;
            // Answer the call
            call.answer(stream);

            // Set the peer stream
            call.on("stream", (incomingStream) => {
                console.log(`Incoming stream from ${callerId} (${callerName})`);
                // setPeerStream(incomingStream);
                if (connectedPeers.find((peer) => peer.id === callerId)) return;
                setConnectedPeers((prevPeers) => {
                    if (prevPeers.some((peer) => peer.id === callerId))
                        return prevPeers;
                    return [
                        ...prevPeers,
                        {
                            id: callerId,
                            stream: incomingStream,
                            name: callerName,
                            muted: false,
                            video: true,
                        },
                    ];
                });
            });
        });
    }, [setConnectedPeers, peer, socket, stream, connectedPeers]);

    const handleLeaveRoom = () => {
        socket.emit("leave-chat", { roomId, id: myId });
        setConnectedPeers([]);
        navigate("/");
    };

    const toggleMic = (userId) => {
        setConnectedPeers((prevPeers) =>
            prevPeers.map((peer) =>
                peer.id === userId ? { ...peer, muted: !peer.muted } : peer
            )
        );

        const userPeer = connectedPeers.find((peer) => peer.id === userId);
        if (userPeer) {
            const userStream = userPeer.stream;
            const tracks = userStream.getTracks();
            const audioTrack = tracks.find((track) => track.kind === "audio");
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled; // Toggle mute/unmute
            }
            setIsMicOn(!isMicOn);
        }

        // Emit the mic toggle event to other users
        socket.emit("toggle-mic", { userId, muted: !userPeer.muted });
    };

    const toggleVideo = (userId) => {
        setConnectedPeers((prevPeers) =>
            prevPeers.map((peer) =>
                peer.id === userId ? { ...peer, video: !peer.video } : peer
            )
        );

        const userPeer = connectedPeers.find((peer) => peer.id === userId);
        if (userPeer) {
            const userStream = userPeer.stream;
            const tracks = userStream.getTracks();
            const videoTrack = tracks.find((track) => track.kind === "video");
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled; // Toggle video on/off
            }
            setIsVideoOn(!isVideoOn);
        }

        // Emit the video toggle event to other users
        socket.emit("toggle-video", { roomId, userId, video: !userPeer.video });
    };

    useEffect(() => {
        // Listen for the mic toggle event from other users
        socket.on("toggle-mic", ({ userId, muted }) => {
            setConnectedPeers((prevPeers) =>
                prevPeers.map((peer) =>
                    peer.id === userId ? { ...peer, muted } : peer
                )
            );
        });

        // Listen for the video toggle event from other users
        socket.on("toggle-video", ({ userId, video }) => {
            setConnectedPeers((prevPeers) =>
                prevPeers.map((peer) =>
                    peer.id === userId ? { ...peer, video } : peer
                )
            );
        });

        // Listen for the user leaving the chat
        socket.on("user-leaves", (userId) => {
            console.log("User left:", userId);
            setConnectedPeers((prevPeers) =>
                prevPeers.filter((peer) => peer.id !== userId)
            );
        });

        return () => {
            socket.off("user-leaves");
            socket.off("toggle-mic");
            socket.off("toggle-video");
        };
    }, [socket]);

    // console.log({ peer });
    // console.log(myId, name, roomId);
    // console.log({ stream, peerStream });
    console.log({ connectedPeers });

    return (
        <div className="">
            <nav className="h-[60px]">
                <div className="flex h-full p-2 px-4 items-center gap-2.5">
                    <img
                        src="/images/user-avatar.png"
                        alt=""
                        className="w-10 h-10"
                    />
                    <span>{capitalizaFirstLetter(name)}</span>
                </div>
            </nav>
            <div
                className={`grid 
                ${
                    connectedPeers.length === 1
                        ? "grid-cols-1"
                        : connectedPeers.length - 1 > 1 &&
                          connectedPeers.length - 1 <= 4
                        ? "grid-cols-2"
                        : connectedPeers.length - 1 > 4 &&
                          connectedPeers.length - 1 <= 9
                        ? "grid-cols-3"
                        : connectedPeers.length - 1 > 9
                        ? "grid-cols-4"
                        : ""
                }  
                gap-4 w-screen h-[calc(100vh-140px)] px-4`}
            >
                {connectedPeers
                    .filter((peer) => peer.id !== myId)
                    .map((peer) =>
                        peer.video ? (
                            <div
                                key={peer.id}
                                className={`relative flex h-full w-full justify-center items-center bg-[#242A2E] rounded-xl overflow-hidden transition-all duration-700`}
                            >
                                <ReactPlayer
                                    url={peer.stream}
                                    playing={true}
                                    muted={peer.muted}
                                    width={"100%"}
                                    height={"100%"}
                                />
                                <span className="absolute left-0 bottom-0 p-2 px-3 drop-shadow-[1px_1px_1px_#1c1c1c] text-sm">
                                    {capitalizaFirstLetter(peer.name)}
                                </span>
                            </div>
                        ) : (
                            <PlayerSkeleton key={peer.id} name={capitalizaFirstLetter(peer.name)} />
                        )
                    )}

                {/* Self video */}
                {connectedPeers
                    .filter((peer) => peer.id === myId)
                    .map((peer) =>
                        peer.video ? (
                            <div
                                key={peer.id}
                                className={`${
                                    connectedPeers.length === 1
                                        ? "h-full w-full relative"
                                        : "absolute bottom-[80px] right-[20px] h-[180px] w-[300px] m-4 shadow-xl"
                                }  flex justify-center items-center bg-[#242A2E] rounded-xl overflow-hidden transition-all duration-700`}
                            >
                                <ReactPlayer
                                    url={peer.stream}
                                    playing={true}
                                    muted={peer.muted}
                                    width={"100%"}
                                    height={"100%"}
                                />
                                <span className="absolute left-0 bottom-0 p-2 px-3 drop-shadow-[1px_1px_1px_#1c1c1c] text-sm">
                                    {capitalizaFirstLetter(peer.name)}
                                </span>
                            </div>
                        ) : connectedPeers.length === 1 ? (
                            <PlayerSkeleton key={peer.id} name={capitalizaFirstLetter(peer.name)} />
                        ) : (
                            <PlayerSkeletonUser
                                key={peer.id}
                                name={capitalizaFirstLetter(peer.name)}
                            />
                        )
                    )}
                <div className="absolute left-0 bottom-0 flex items-center justify-center gap-5 w-screen h-[80px]">
                    <div className="flex items-center justify-center bg-[#242A2E] rounded-full p-3">
                        <Users width={24} height={24} />
                    </div>
                    <div
                        className="flex items-center justify-center bg-[#242A2E] rounded-full p-3 cursor-pointer"
                        onClick={() => toggleMic(myId)} // Toggle mic for yourself
                    >
                        {!isMicOn ? (
                            <Mic width={24} height={24} />
                        ) : (
                            <MicOff width={24} height={24} />
                        )}
                    </div>
                    <div className="flex items-center justify-center bg-red-700 rounded-full p-3 rotate-[134deg] cursor-pointer">
                        <Phone
                            fill="white"
                            strokeWidth={0}
                            width={30}
                            height={30}
                            onClick={handleLeaveRoom}
                        />
                    </div>

                    <div
                        className="flex items-center justify-center bg-[#242A2E] rounded-full p-3"
                        onClick={() => toggleVideo(myId)}
                    >
                        {!isVideoOn ? (
                            <Video width={24} height={24} />
                        ) : (
                            <VideoOff width={24} height={24} />
                        )}
                    </div>
                    <div className="flex items-center justify-center bg-[#242A2E] rounded-full p-3">
                        <MessageSquareText width={24} height={24} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatRoom;
