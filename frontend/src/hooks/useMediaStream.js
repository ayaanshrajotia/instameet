import { useEffect, useRef, useState } from "react";

const useMediaStream = () => {
    const [stream, setStream] = useState(null);

    const isStreamSet = useRef(false);

    useEffect(() => {
        if (isStreamSet.current) return;
        isStreamSet.current = true;

        (async function initStream() {
            try {
                const userStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user" },
                    audio: true,
                });
                setStream(userStream);
            } catch (error) {
                console.error("Error accessing media devices.", error);
            }
        })();
    }, []);

    return { stream };
};

export default useMediaStream;
