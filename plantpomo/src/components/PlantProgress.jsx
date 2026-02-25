import {
  Sprout,
  TreePine,
  Flower2,
  Trees,
  Palmtree,
  Mountain,
  Waves,
  Castle,
  Snowflake,
  Flame,
} from "lucide-react";

/** Map plant/land ids → their lucide icon component + color */
const ICON_MAP = {
  // Plants
  sprout: { icon: Sprout, color: "text-emerald-400", glow: "rgba(52,211,153,0.9)" },
  flower: { icon: Flower2, color: "text-pink-400", glow: "rgba(244,114,182,0.9)" },
  pine: { icon: TreePine, color: "text-green-400", glow: "rgba(74,222,128,0.9)" },
  palm: { icon: Palmtree, color: "text-lime-400", glow: "rgba(163,230,53,0.9)" },
  forest: { icon: Trees, color: "text-teal-400", glow: "rgba(45,212,191,0.9)" },
  frost: { icon: Snowflake, color: "text-cyan-300", glow: "rgba(103,232,249,0.9)" },
  fire: { icon: Flame, color: "text-orange-400", glow: "rgba(251,146,60,0.9)" },
  // Lands
  meadow: { icon: Mountain, color: "text-emerald-400", glow: "rgba(52,211,153,0.9)" },
  ocean: { icon: Waves, color: "text-sky-400", glow: "rgba(56,189,248,0.9)" },
  highland: { icon: Mountain, color: "text-stone-400", glow: "rgba(168,162,158,0.9)" },
  castle: { icon: Castle, color: "text-violet-400", glow: "rgba(167,139,250,0.9)" },
  volcano: { icon: Flame, color: "text-red-500", glow: "rgba(239,68,68,0.9)" },
};

const PlantProgress = ({
  timerProgress = 75,
  growthProgress = 60,
  onPlantClick,
  selectedPlant,
  selectedLand,
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

  // Resolve plant icon
  const plantEntry = selectedPlant
    ? ICON_MAP[selectedPlant.id] ?? ICON_MAP.sprout
    : ICON_MAP.sprout;
  const PlantIcon = plantEntry.icon;

  // Resolve land name badge
  const landName = selectedLand?.name ?? null;

  return (
    <div className="flex flex-col items-center mb-2">
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
              transition: "stroke-dashoffset 0.6s ease",
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
              transition: "stroke-dashoffset 0.6s ease",
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
              flex flex-col items-center justify-center gap-1
              cursor-pointer
              transition-all duration-300
              backdrop-blur-xl
              bg-white/10
              border border-white/20
              shadow-[0_0_30px_rgba(34,197,94,0.25)]
              hover:scale-105
              hover:brightness-110
            "
            title="Open plant shop"
          >
            <PlantIcon
              size={56}
              className={`${plantEntry.color} transition-all duration-500`}
              style={{
                filter: `drop-shadow(0 0 10px ${plantEntry.glow})`,
              }}
            />
            {/* Plant name label */}
            <span
              className={`text-[10px] font-semibold uppercase tracking-widest ${plantEntry.color} opacity-80`}
            >
              {selectedPlant?.name ?? "Sprout"}
            </span>
          </button>
        </div>
      </div>

      {/* Land badge — shown below the ring */}
      {landName && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-400/80 font-medium bg-blue-900/20 border border-blue-500/20 px-3 py-0.5 rounded-full">
          <span>🏔️</span>
          <span>{landName}</span>
        </div>
      )}
    </div>
  );
};

export default PlantProgress;