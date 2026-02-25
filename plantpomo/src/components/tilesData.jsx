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

export const plants = [
    { id: "sprout", name: "Sprout", icon: <Sprout size={28} />, rarity: "common", cost: null, owned: true },
    { id: "flower", name: "Bloom", icon: <Flower2 size={28} />, rarity: "common", cost: null, owned: true },
    { id: "pine", name: "Pine", icon: <TreePine size={28} />, rarity: "common", cost: null, owned: false },
    { id: "palm", name: "Tropical", icon: <Palmtree size={28} />, rarity: "rare", cost: 50, owned: false },
    { id: "forest", name: "Ancient Oak", icon: <Trees size={28} />, rarity: "rare", cost: 120, owned: false },
    { id: "frost", name: "Frost Fern", icon: <Snowflake size={28} />, rarity: "mythical", cost: 300, owned: false },
    { id: "fire", name: "Ember Root", icon: <Flame size={28} />, rarity: "mythical", cost: 500, owned: false },
    // Image assets
    { id: "carnation", name: "Carnation", image: imgCarnation, rarity: "common", cost: null, owned: true },
    { id: "lavander", name: "Lavender", image: imgLavander, rarity: "rare", cost: null, owned: true },
    { id: "sakura", name: "Sakura", image: imgSakura, rarity: "mythical", cost: null, owned: true },
];

export const lands = [
    { id: "meadow", name: "Meadow", icon: <Mountain size={28} />, rarity: "common", cost: null, owned: true },
    { id: "ocean", name: "Ocean Shore", icon: <Waves size={28} />, rarity: "common", cost: null, owned: false },
    { id: "highland", name: "Highlands", icon: <Mountain size={28} />, rarity: "rare", cost: 80, owned: false },
    { id: "castle", name: "Castle Ruins", icon: <Castle size={28} />, rarity: "rare", cost: 150, owned: false },
    { id: "volcano", name: "Volcanic", icon: <Flame size={28} />, rarity: "mythical", cost: 400, owned: false },
];
