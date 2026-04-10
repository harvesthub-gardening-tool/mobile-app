import { Dimensions } from "react-native";
import type { PlantType } from "../types/garden";

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

export const MAP_SIZE = 2000;
export const DEFAULT_CELL = 140;
export const GRID_COLS = 8;
export const GRID_ROWS = 8;
export const CELL_GAP = 12;
export const STORAGE_KEY = "garden_plants";

export const MIN_SCALE = 0.15;
export const MAX_SCALE = 3;
export const DECAY_DECELERATION = 0.997;

export const SONDE_TYPES = [
  { id: "sonde1", name: "Sonde Humidit\u00e9", icon: "droplet" as const },
  { id: "sonde2", name: "Sonde Temp\u00e9rature", icon: "thermometer" as const },
] as const;

export const PLANT_CATALOG: PlantType[] = [
  { id: "t1", name: "Tomate", emoji: "\ud83c\udf45", category: "legume" },
  { id: "t2", name: "Aubergine", emoji: "\ud83c\udf46", category: "legume" },
  { id: "t3", name: "Carotte", emoji: "\ud83e\udd55", category: "legume" },
  { id: "t4", name: "Salade", emoji: "\ud83e\udd6c", category: "legume" },
  { id: "t5", name: "Poivron", emoji: "\ud83e\uded1", category: "legume" },
  { id: "t6", name: "Brocoli", emoji: "\ud83e\udd66", category: "legume" },
  { id: "t7", name: "Ma\u00efs", emoji: "\ud83c\udf3d", category: "legume" },
  { id: "t8", name: "Oignon", emoji: "\ud83e\uddc5", category: "legume" },
  { id: "t9", name: "Ail", emoji: "\ud83e\uddc4", category: "legume" },
  { id: "t10", name: "Pomme de terre", emoji: "\ud83e\udd54", category: "legume" },
  { id: "t11", name: "Concombre", emoji: "\ud83e\udd52", category: "legume" },
  { id: "t12", name: "Courgette", emoji: "\ud83e\udd52", category: "legume" },
  { id: "t13", name: "Petit pois", emoji: "\ud83e\udedb", category: "legume" },
  { id: "t14", name: "Haricot", emoji: "\ud83e\uded8", category: "legume" },
  { id: "t15", name: "Radis", emoji: "\ud83e\uded0", category: "legume" },
  { id: "t16", name: "Chou", emoji: "\ud83e\udd6c", category: "legume" },
  { id: "t17", name: "Chou-fleur", emoji: "\ud83e\udd66", category: "legume" },
  { id: "t18", name: "\u00c9pinard", emoji: "\ud83e\udd6c", category: "legume" },
  { id: "t19", name: "Betterave", emoji: "\ud83e\uded0", category: "legume" },
  { id: "t20", name: "Navet", emoji: "\ud83e\udd54", category: "legume" },
  { id: "t21", name: "Artichaut", emoji: "\ud83c\udf3f", category: "legume" },
  { id: "t22", name: "Asperge", emoji: "\ud83c\udf3f", category: "legume" },
  { id: "t23", name: "C\u00e9leri", emoji: "\ud83e\udd6c", category: "legume" },
  { id: "t24", name: "Fenouil", emoji: "\ud83c\udf3f", category: "legume" },
  { id: "t25", name: "Poireau", emoji: "\ud83e\uddc5", category: "legume" },
  { id: "t26", name: "Citrouille", emoji: "\ud83c\udf83", category: "legume" },
  { id: "t27", name: "Patate douce", emoji: "\ud83c\udf60", category: "legume" },
  { id: "f1", name: "Fraise", emoji: "\ud83c\udf53", category: "fruit" },
  { id: "f2", name: "Past\u00e8que", emoji: "\ud83c\udf49", category: "fruit" },
  { id: "f3", name: "Raisin", emoji: "\ud83c\udf47", category: "fruit" },
  { id: "f4", name: "Cerise", emoji: "\ud83c\udf52", category: "fruit" },
  { id: "f5", name: "Citron", emoji: "\ud83c\udf4b", category: "fruit" },
  { id: "f6", name: "P\u00eache", emoji: "\ud83c\udf51", category: "fruit" },
  { id: "f7", name: "Pomme", emoji: "\ud83c\udf4e", category: "fruit" },
  { id: "f8", name: "Poire", emoji: "\ud83c\udf50", category: "fruit" },
  { id: "f9", name: "Orange", emoji: "\ud83c\udf4a", category: "fruit" },
  { id: "f10", name: "Banane", emoji: "\ud83c\udf4c", category: "fruit" },
  { id: "f11", name: "Ananas", emoji: "\ud83c\udf4d", category: "fruit" },
  { id: "f12", name: "Mangue", emoji: "\ud83e\udd6d", category: "fruit" },
  { id: "f13", name: "Kiwi", emoji: "\ud83e\udd5d", category: "fruit" },
  { id: "f14", name: "Myrtille", emoji: "\ud83e\uded0", category: "fruit" },
  { id: "f15", name: "Framboise", emoji: "\ud83c\udf53", category: "fruit" },
  { id: "f16", name: "Abricot", emoji: "\ud83c\udf51", category: "fruit" },
  { id: "f17", name: "Prune", emoji: "\ud83c\udf51", category: "fruit" },
  { id: "f18", name: "Figue", emoji: "\ud83c\udf47", category: "fruit" },
  { id: "f19", name: "Melon", emoji: "\ud83c\udf48", category: "fruit" },
  { id: "f20", name: "Noix de coco", emoji: "\ud83e\udd65", category: "fruit" },
  { id: "f21", name: "Avocat", emoji: "\ud83e\udd51", category: "fruit" },
  { id: "f22", name: "Grenade", emoji: "\ud83c\udf4e", category: "fruit" },
  { id: "f23", name: "Cassis", emoji: "\ud83e\uded0", category: "fruit" },
  { id: "f24", name: "Groseille", emoji: "\ud83c\udf52", category: "fruit" },
  { id: "h1", name: "Basilic", emoji: "\ud83c\udf3f", category: "herbe" },
  { id: "h2", name: "Menthe", emoji: "\ud83c\udf43", category: "herbe" },
  { id: "h3", name: "Piment", emoji: "\ud83c\udf36\ufe0f", category: "herbe" },
  { id: "h4", name: "Tournesol", emoji: "\ud83c\udf3b", category: "herbe" },
  { id: "h5", name: "Persil", emoji: "\ud83c\udf3f", category: "herbe" },
  { id: "h6", name: "Ciboulette", emoji: "\ud83c\udf3f", category: "herbe" },
  { id: "h7", name: "Thym", emoji: "\ud83c\udf3f", category: "herbe" },
  { id: "h8", name: "Romarin", emoji: "\ud83c\udf3f", category: "herbe" },
  { id: "h9", name: "Coriandre", emoji: "\ud83c\udf3f", category: "herbe" },
  { id: "h10", name: "Aneth", emoji: "\ud83c\udf3f", category: "herbe" },
  { id: "h11", name: "Sauge", emoji: "\ud83c\udf43", category: "herbe" },
  { id: "h12", name: "Origan", emoji: "\ud83c\udf43", category: "herbe" },
  { id: "h13", name: "Estragon", emoji: "\ud83c\udf3f", category: "herbe" },
  { id: "h14", name: "Lavande", emoji: "\ud83d\udc9c", category: "herbe" },
  { id: "h15", name: "Citronnelle", emoji: "\ud83c\udf3f", category: "herbe" },
  { id: "h16", name: "Rose", emoji: "\ud83c\udf39", category: "herbe" },
  { id: "h17", name: "Tulipe", emoji: "\ud83c\udf37", category: "herbe" },
];

const GRASS_STEP = 40;
const GRASS_EMOJIS = ["\ud83c\udf3f", "\u2618\ufe0f", "\ud83c\udf40"];

function generateGrassDecorations() {
  const decorations: Array<{
    x: number;
    y: number;
    emoji: string;
    size: number;
  }> = [];
  let idx = 0;
  for (let y = 0; y < MAP_SIZE; y += GRASS_STEP) {
    for (let x = 0; x < MAP_SIZE; x += GRASS_STEP) {
      const seed = idx * 7919;
      const offsetX = (seed % 15) - 7;
      const offsetY = ((seed * 3) % 15) - 7;
      decorations.push({
        x: x + offsetX,
        y: y + offsetY,
        emoji: GRASS_EMOJIS[idx % GRASS_EMOJIS.length],
        size: 22 + (seed % 8),
      });
      idx++;
    }
  }
  return decorations;
}

export const GRASS_DECORATIONS = generateGrassDecorations();
