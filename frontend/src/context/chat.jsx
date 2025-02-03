import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => {
    return useContext(ChatContext);
};

// eslint-disable-next-line react/prop-types
export const ChatProvider = ({ children }) => {
    const [name, setName] = useState("");
    const [room, setRoom] = useState("");

    return (
        <ChatContext.Provider value={{ name, room, setName, setRoom }}>
            {children}
        </ChatContext.Provider>
    );
};
