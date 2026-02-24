import { Sprout } from "lucide-react";

const PlantProgress = ({
  timerProgress = 75,
  growthProgress = 60,
  onPlantClick,
}) => {
  const outerRadius = 108;
  const innerRadius = 96;
  const strokeWidth = 6;

  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const outerOffset =
    outerCircumference - (timerProgress / 100) * outerCircumference;
  const innerOffset =
    innerCircumference - (growthProgress / 100) * innerCircumference;

  return (
    <div className="flex justify-center mb-2">
      <div className="relative w-[240px] h-[240px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
          {/* 🔵 OUTER TRACK */}
          <circle
            cx="120"
            cy="120"
            r={outerRadius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />

          {/* 🔵 TIMER PROGRESS (CYAN NEON) */}
          <circle
            cx="120"
            cy="120"
            r={outerRadius}
            fill="none"
            stroke="hsl(190 95% 55%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={outerCircumference}
            strokeDashoffset={outerOffset}
            style={{
              filter: "drop-shadow(0 0 8px hsl(190 95% 55%))",
            }}
          />

          {/* 🟢 INNER TRACK */}
          <circle
            cx="120"
            cy="120"
            r={innerRadius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />

          {/* 🟢 GROWTH PROGRESS (GREEN NEON) */}
          <circle
            cx="120"
            cy="120"
            r={innerRadius}
            fill="none"
            stroke="hsl(145 85% 55%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={innerCircumference}
            strokeDashoffset={innerOffset}
            style={{
              filter: "drop-shadow(0 0 8px hsl(145 85% 55%))",
            }}
          />
        </svg>

        {/* 🌱 GLASS CENTER */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={onPlantClick}
            className="
              w-[160px] h-[160px]
              rounded-full
              flex items-center justify-center
              cursor-pointer
              transition-all duration-300
              backdrop-blur-xl
              bg-white/10
              border border-white/20
              shadow-[0_0_30px_rgba(34,197,94,0.25)]
              hover:scale-105
              hover:brightness-110
            "
          >
            <Sprout
              size={72}
              className="text-emerald-400"
              style={{
                filter: "drop-shadow(0 0 10px rgba(52,211,153,0.9))",
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantProgress;