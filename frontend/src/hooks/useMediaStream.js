import { useEffect, useState } from "react";

const useMediaStream = () => {
    const [stream, setStream] = useState(null);

    useEffect(() => {
        let isMounted = true; // Prevents updating state if component unmounts

        (async function initStream() {
            try {
                const userStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                if (isMounted) setStream(userStream);
            } catch (error) {
                console.error("Error accessing media devices:", error);
            }
        })();

        return () => {
            isMounted = false; // Cleanup on unmount
        };
    }, []);

    return { stream };
};

export default useMediaStream;