import {
  X,
  Droplets,
  Lock,
  Check,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { plants, lands } from "./tilesData";

const rarityColors = {
  common: {
    border: "border-emerald-600/40",
    bg: "bg-emerald-900/20",
    text: "text-emerald-400",
    glow: "",
    badge: "bg-emerald-800/60 text-emerald-300",
    selectedRing: "ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-black/60",
    buyBtn: "bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30",
  },
  rare: {
    border: "border-blue-500/50",
    bg: "bg-blue-900/20",
    text: "text-blue-400",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]",
    badge: "bg-blue-800/60 text-blue-300",
    selectedRing: "ring-2 ring-blue-400/80 ring-offset-2 ring-offset-black/60",
    buyBtn: "bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30",
  },
  mythical: {
    border: "border-purple-500/50",
    bg: "bg-purple-900/20",
    text: "text-purple-400",
    glow: "shadow-[0_0_16px_rgba(168,85,247,0.4)]",
    badge: "bg-purple-800/60 text-purple-300",
    selectedRing: "ring-2 ring-purple-400/80 ring-offset-2 ring-offset-black/60",
    buyBtn: "bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-purple-600/30",
  },
};

/* ─── Shop Tile ─────────────────────────────────────────────────────────────── */
const ShopTile = ({
  item,
  isSelected,
  isOwned,
  onSelect,
  onBuy,
  selectionLocked = false,
  droplets = 0,
  buying = false,
}) => {
  const r = rarityColors[item.rarity];
  const needsPurchase = item.cost !== null && !isOwned;
  const canAfford = droplets >= (item.cost ?? 0);
  const canSelect = isOwned && !selectionLocked;

  return (
    <div
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${r.border} ${r.bg} ${r.glow} transition-all duration-200 ${canSelect ? "hover:brightness-110 hover:scale-105 cursor-pointer" : "cursor-default"
        } ${isSelected ? r.selectedRing : ""}`}
      onClick={() => canSelect && onSelect(item)}
    >
      {/* Rarity badge */}
      <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${r.badge}`}>
        {item.rarity}
      </span>

      {/* Selected checkmark */}
      {isSelected && (
        <span className="absolute top-1.5 right-1.5 bg-white/20 rounded-full p-0.5">
          <Check size={10} className="text-white" />
        </span>
      )}

      {/* Icon / Image */}
      <div className={`${r.text} transition-transform flex items-center justify-center h-10 w-10`}>
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-10 h-10 object-contain drop-shadow-md" />
        ) : (
          item.icon
        )}
      </div>

      {/* Name */}
      <span className="text-[11px] font-medium text-foreground/80">{item.name}</span>

      {/* Status / Buy button */}
      {isSelected ? (
        <span className="flex items-center gap-1 text-[10px] text-white font-bold">✦ Active</span>
      ) : isOwned ? (
        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
          <Check size={10} /> Owned
        </span>
      ) : item.cost === null ? (
        <span className="text-[10px] text-muted-foreground font-medium">Free</span>
      ) : (
        <button
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${r.buyBtn}`}
          onClick={(e) => { e.stopPropagation(); onBuy(item); }}
          disabled={!canAfford || buying || selectionLocked}
          title={!canAfford ? `Need ${item.cost} 💧` : `Buy for ${item.cost} 💧`}
        >
          {buying ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <ShoppingCart size={10} />
          )}
          {item.cost} <Droplets size={9} />
        </button>
      )}

      {/* Lock overlay for locked but can't afford */}
      {needsPurchase && !buying && (
        <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
          <Lock size={18} className="text-white/50" />
        </div>
      )}
    </div>
  );
};

/* ─── PlantShopSidebar ──────────────────────────────────────────────────────── */
const PlantShopSidebar = ({
  open,
  onClose,
  selectedTile,
  onSelectTile,
  selectionLocked = false,
  // DB-driven props from parent
  profile = null,
  ownedPlantIds = new Set(),
  ownedLandIds = new Set(),
  onBuyItem,       // async (item_type, item_id, cost) => { ok, error }
}) => {
  const [tab, setTab] = useState("plants");
  const [buyingId, setBuyingId] = useState(null); // item being purchased
  const [toast, setToast] = useState(null);        // { msg, type }

  const items = tab === "plants" ? plants : lands;
  const ownedSet = tab === "plants" ? ownedPlantIds : ownedLandIds;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuy = async (item) => {
    if (!onBuyItem) return;
    setBuyingId(item.id);
    const res = await onBuyItem(tab === "plants" ? "plant" : "land", item.id, item.cost);
    setBuyingId(null);
    if (res.ok) showToast(`${item.name} unlocked! 🎉`);
    else showToast(res.error ?? "Purchase failed", "error");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[360px] max-w-[90vw] bg-[hsl(220,20%,8%)]/80 backdrop-blur-2xl border-l border-white/10 transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-foreground tracking-tight">🌿 Shop</h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-sky-400 bg-sky-900/30 px-3 py-1 rounded-full">
              <Droplets size={14} /> {profile?.droplets ?? 0}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-5 mb-3 rounded-lg px-3 py-2 text-xs font-medium border ${toast.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}>
            {toast.msg}
          </div>
        )}

        {/* Active selection */}
        <div className="mx-5 mb-3 flex items-center gap-3 text-xs text-white/50">
          <span>✦ Active: <span className="text-emerald-400 font-semibold">{selectedTile?.name ?? "—"}</span></span>
        </div>

        {selectionLocked && (
          <div className="mx-5 mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            Tile selection is locked while a session is active.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mx-5 mb-4 p-1 rounded-lg bg-white/5">
          <button
            onClick={() => setTab("plants")}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${tab === "plants" ? "bg-timer-green/20 text-timer-green" : "text-muted-foreground hover:text-foreground"}`}
          >
            🌱 Plants
          </button>
          <button
            onClick={() => setTab("lands")}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${tab === "lands" ? "bg-timer-green/20 text-timer-green" : "text-muted-foreground hover:text-foreground"}`}
          >
            🏔️ Lands
          </button>
        </div>

        {/* Grid */}
        <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <ShopTile
                key={item.id}
                item={item}
                isSelected={selectedTile?.id === item.id}
                isOwned={ownedSet.has(item.id)}
                onSelect={onSelectTile}
                onBuy={handleBuy}
                selectionLocked={selectionLocked}
                droplets={profile?.droplets ?? 0}
                buying={buyingId === item.id}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlantShopSidebar;
