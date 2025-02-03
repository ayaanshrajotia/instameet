import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import "./App.css";
import ChatRoom from "./pages/ChatRoom";
import { ChatProvider } from "./context/chat";

function App() {
    return (
        <div className="bg-[#1B2125] text-white w-screen h-screen relative">
            <ChatProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/chat-room/:roomId"
                            element={<ChatRoom />}
                        />
                    </Routes>
                </BrowserRouter>
            </ChatProvider>
        </div>
    );
}

export default App;
