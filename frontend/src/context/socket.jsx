import { createContext, useContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const BASE_URL =
    import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useSocket = () => {
    return useContext(SocketContext);
};

// eslint-disable-next-line react/prop-types
export const SocketProvider = ({ children }) => {
    const socket = io(BASE_URL);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
