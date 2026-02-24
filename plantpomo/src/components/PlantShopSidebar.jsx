import {
  X,
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
  Droplets,
  Lock,
  Check,
} from "lucide-react";
import { useState } from "react";

const rarityColors = {
  common: {
    border: "border-emerald-600/40",
    bg: "bg-emerald-900/20",
    text: "text-emerald-400",
    glow: "",
    badge: "bg-emerald-800/60 text-emerald-300",
  },
  rare: {
    border: "border-blue-500/50",
    bg: "bg-blue-900/20",
    text: "text-blue-400",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]",
    badge: "bg-blue-800/60 text-blue-300",
  },
  mythical: {
    border: "border-purple-500/50",
    bg: "bg-purple-900/20",
    text: "text-purple-400",
    glow: "shadow-[0_0_16px_rgba(168,85,247,0.4)]",
    badge: "bg-purple-800/60 text-purple-300",
  },
};

const plants = [
  { id: "sprout", name: "Sprout", icon: <Sprout size={28} />, rarity: "common", cost: null, owned: true },
  { id: "flower", name: "Bloom", icon: <Flower2 size={28} />, rarity: "common", cost: null, owned: true },
  { id: "pine", name: "Pine", icon: <TreePine size={28} />, rarity: "common", cost: null, owned: false },
  { id: "palm", name: "Tropical", icon: <Palmtree size={28} />, rarity: "rare", cost: 50, owned: false },
  { id: "forest", name: "Ancient Oak", icon: <Trees size={28} />, rarity: "rare", cost: 120, owned: false },
  { id: "frost", name: "Frost Fern", icon: <Snowflake size={28} />, rarity: "mythical", cost: 300, owned: false },
  { id: "fire", name: "Ember Root", icon: <Flame size={28} />, rarity: "mythical", cost: 500, owned: false },
];

const lands = [
  { id: "meadow", name: "Meadow", icon: <Mountain size={28} />, rarity: "common", cost: null, owned: true },
  { id: "ocean", name: "Ocean Shore", icon: <Waves size={28} />, rarity: "common", cost: null, owned: false },
  { id: "highland", name: "Highlands", icon: <Mountain size={28} />, rarity: "rare", cost: 80, owned: false },
  { id: "castle", name: "Castle Ruins", icon: <Castle size={28} />, rarity: "rare", cost: 150, owned: false },
  { id: "volcano", name: "Volcanic", icon: <Flame size={28} />, rarity: "mythical", cost: 400, owned: false },
];

const ShopTile = ({ item }) => {
  const r = rarityColors[item.rarity];
  const locked = !item.owned && item.cost !== null;

  return (
    <button
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${r.border} ${r.bg} ${r.glow} transition-all duration-200 hover:scale-105 hover:brightness-110 cursor-pointer group`}
    >
      {/* Rarity badge */}
      <span
        className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${r.badge}`}
      >
        {item.rarity}
      </span>

      {/* Icon */}
      <div className={`${r.text} transition-transform group-hover:scale-110`}>
        {item.icon}
      </div>

      {/* Name */}
      <span className="text-[11px] font-medium text-foreground/80">
        {item.name}
      </span>

      {/* Status */}
      {item.owned ? (
        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
          <Check size={10} /> Owned
        </span>
      ) : item.cost === null ? (
        <span className="text-[10px] text-muted-foreground font-medium">
          Free
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] text-sky-400 font-semibold">
          <Droplets size={10} /> {item.cost}
        </span>
      )}

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
          <Lock size={18} className="text-white/50" />
        </div>
      )}
    </button>
  );
};

const PlantShopSidebar = ({ open, onClose }) => {
  const [tab, setTab] = useState("plants");
  const items = tab === "plants" ? plants : lands;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[360px] max-w-[90vw] bg-[hsl(220,20%,8%)]/80 backdrop-blur-2xl border-l border-white/10 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            🌿 Shop
          </h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-sky-400 bg-sky-900/30 px-3 py-1 rounded-full">
              <Droplets size={14} /> 250
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-5 mb-4 p-1 rounded-lg bg-white/5">
          <button
            onClick={() => setTab("plants")}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              tab === "plants"
                ? "bg-timer-green/20 text-timer-green"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🌱 Plants
          </button>
          <button
            onClick={() => setTab("lands")}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              tab === "lands"
                ? "bg-timer-green/20 text-timer-green"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🏔️ Lands
          </button>
        </div>

        {/* Grid */}
        <div
          className="px-5 pb-5 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 140px)" }}
        >
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <ShopTile key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlantShopSidebar;