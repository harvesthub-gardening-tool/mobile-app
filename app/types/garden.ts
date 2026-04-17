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
    nodeId?: string;
};

export type PlacedPlant = {
    id: string;
    plantType: PlantType;
    x: number;
    y: number;
    width: number;
    height: number;
    quantity: number;
    sondeId: string | null;
};
