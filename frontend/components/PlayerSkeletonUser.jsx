import { Camera } from "lucide-react";

// eslint-disable-next-line react/prop-types
function PlayerSkeleton({ name }) {
    return (
        <div className="bg-[#242A2E] absolute bottom-[80px] right-[20px] h-[180px] w-[300px] m-4 shadow-xl flex items-center justify-center rounded-xl">
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
