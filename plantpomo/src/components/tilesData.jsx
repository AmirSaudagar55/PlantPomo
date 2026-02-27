import React from "react";
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

import imgCarnation from "../assets/PlantTiles/Carnation.png";
import imgLavander from "../assets/PlantTiles/Lavander.png";
import imgSakura from "../assets/PlantTiles/Sakura.png";

/**
 * Items with cost === null are FREE (always unlocked for everyone).
 * Items with cost > 0 must be purchased — ownership is stored in `user_inventory` on Supabase.
 * buildTime (minutes) = how many focus minutes are needed to grow 1 garden instance.
 * DEFAULT_OWNED lists item IDs that are free and thus always "owned" (no DB row needed).
 */
export const DEFAULT_OWNED_PLANTS = ["sprout", "flower", "carnation", "lavander", "sakura"];
export const DEFAULT_OWNED_LANDS = ["meadow"];

export const plants = [
    { id: "sprout", name: "Sprout", icon: <Sprout size={28} />, rarity: "common", cost: null, buildTime: 25 },
    { id: "flower", name: "Bloom", icon: <Flower2 size={28} />, rarity: "common", cost: null, buildTime: 25 },
    { id: "pine", name: "Pine", icon: <TreePine size={28} />, rarity: "common", cost: null, buildTime: 30 },
    { id: "palm", name: "Tropical", icon: <Palmtree size={28} />, rarity: "rare", cost: 50, buildTime: 60 },
    { id: "forest", name: "Ancient Oak", icon: <Trees size={28} />, rarity: "rare", cost: 120, buildTime: 90 },
    { id: "frost", name: "Frost Fern", icon: <Snowflake size={28} />, rarity: "mythical", cost: 300, buildTime: 120 },
    { id: "fire", name: "Ember Root", icon: <Flame size={28} />, rarity: "mythical", cost: 500, buildTime: 150 },
    // Image assets (free)
    { id: "carnation", name: "Carnation", image: imgCarnation, rarity: "common", cost: null, buildTime: 25 },
    { id: "lavander", name: "Lavender", image: imgLavander, rarity: "rare", cost: null, buildTime: 40 },
    { id: "sakura", name: "Sakura", image: imgSakura, rarity: "mythical", cost: null, buildTime: 60 },
];

export const lands = [
    { id: "meadow", name: "Meadow", icon: <Mountain size={28} />, rarity: "common", cost: null, buildTime: 25 },
    { id: "ocean", name: "Ocean Shore", icon: <Waves size={28} />, rarity: "common", cost: null, buildTime: 30 },
    { id: "highland", name: "Highlands", icon: <Mountain size={28} />, rarity: "rare", cost: 80, buildTime: 60 },
    { id: "castle", name: "Castle Ruins", icon: <Castle size={28} />, rarity: "rare", cost: 150, buildTime: 90 },
    { id: "volcano", name: "Volcanic", icon: <Flame size={28} />, rarity: "mythical", cost: 400, buildTime: 120 },
];
