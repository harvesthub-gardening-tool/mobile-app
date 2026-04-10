export type PlantType = {
  id: string;
  name: string;
  emoji: string;
  category: "fruit" | "legume" | "herbe";
};

export type PlacedSonde = {
  id: string;
  name: string;
  x: number;
  y: number;
};

export type PlacedPlant = {
  id: string;
  plantType: PlantType;
  x: number;
  y: number;
  size: number;
  quantity: number;
  sondeId: string | null;
};
