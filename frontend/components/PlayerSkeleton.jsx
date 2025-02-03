import { Camera } from "lucide-react";

// eslint-disable-next-line react/prop-types
function PlayerSkeleton({ name }) {
    return (
        <div className="bg-[#242A2E] w-full h-full flex items-center justify-center rounded-xl relative">
            <div className="bg-[#4E544F] rounded-full p-7">
                <Camera width={46} height={46} className="" stroke="#2a2f2a" />
            </div>
            <span className="absolute left-0 bottom-0 p-2 px-3 drop-shadow-[1px_1px_1px_#1c1c1c] text-sm">
                {name}
            </span>
        </div>
    );
}

export default PlayerSkeleton;
