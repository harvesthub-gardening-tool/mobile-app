import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import {
    STORAGE_KEY,
    DEFAULT_CELL,
    MIN_CARD_SIZE,
    MAP_SIZE,
    GRID_COLS,
    GRID_ROWS,
    CELL_GAP,
} from "../constants/garden";
import type { PlacedPlant, PlacedSonde, PlantType } from "../types/garden";

let plantIdCounter = Date.now();

export function useGardenStorage() {
    const { userId } = useAuth();
    const [plants, setPlants] = useState<PlacedPlant[]>([]);
    const [sondes, setSondes] = useState<PlacedSonde[]>([]);

    const userKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const sondeKey = `${userKey}_sondes`;

    useEffect(() => {
        AsyncStorage.getItem(userKey).then((data) => {
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    const migrated = parsed.map((p: Record<string, unknown>) => {
                        let base: Record<string, unknown> = { ...p };
                        // Migration width/height depuis size
                        if (typeof base.width !== "number" || typeof base.height !== "number") {
                            const s = typeof base.size === "number" ? Math.max(MIN_CARD_SIZE, base.size) : DEFAULT_CELL;
                            delete base.size;
                            base = { ...base, width: s, height: s };
                        }
                        // Migration sondeIds → sondeId
                        if (Array.isArray(base.sondeIds)) {
                            base.sondeId = (base.sondeIds as string[])[0] ?? null;
                            delete base.sondeIds;
                        }
                        if (!("sondeId" in base)) base.sondeId = null;
                        return base;
                    });
                    setPlants(migrated as PlacedPlant[]);
                    if (JSON.stringify(migrated) !== data) {
                        AsyncStorage.setItem(userKey, JSON.stringify(migrated));
                    }
                } catch {
                    setPlants([]);
                }
            } else {
                setPlants([]);
            }
        });
        AsyncStorage.getItem(sondeKey).then((data) => {
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    // Migration: renommer les anciennes sondes typées en "Sonde N"
                    const migrated = parsed.map((s: Record<string, unknown>, i: number) => ({
                        ...s,
                        name: `Sonde ${i + 1}`,
                    }));
                    setSondes(migrated);
                    if (JSON.stringify(migrated) !== data) {
                        AsyncStorage.setItem(sondeKey, JSON.stringify(migrated));
                    }
                } catch { setSondes([]); }
            } else {
                setSondes([]);
            }
        });
    }, [userKey, sondeKey]);

    const savePlants = useCallback(
        (newPlants: PlacedPlant[]) => {
            setPlants(newPlants);
            AsyncStorage.setItem(userKey, JSON.stringify(newPlants));
        },
        [userKey],
    );

    const saveSondes = useCallback(
        (newSondes: PlacedSonde[]) => {
            setSondes(newSondes);
            AsyncStorage.setItem(sondeKey, JSON.stringify(newSondes));
        },
        [sondeKey],
    );

    const addPlant = useCallback(
        (plantType: PlantType) => {
            const pos = findFreePosition(plants);
            savePlants([...plants, {
                id: `placed_${++plantIdCounter}`,
                plantType,
                x: pos.x,
                y: pos.y,
                width: DEFAULT_CELL,
                height: DEFAULT_CELL,
                quantity: 1,
                sondeId: null,
            }]);
        },
        [plants, savePlants],
    );

    const removePlant = useCallback(
        (id: string) => savePlants(plants.filter((p) => p.id !== id)),
        [plants, savePlants],
    );

    const updatePlant = useCallback(
        (id: string, updates: Partial<Pick<PlacedPlant, "x" | "y" | "width" | "height" | "quantity" | "sondeId" | "plantType">>) => {
            savePlants(plants.map((p) => (p.id === id ? { ...p, ...updates } : p)));
        },
        [plants, savePlants],
    );

    const addSonde = useCallback(() => {
        const num = sondes.length + 1;
        saveSondes([...sondes, {
            id: `sonde_${Date.now()}`,
            name: `Sonde ${num}`,
            x: MAP_SIZE / 2,
            y: MAP_SIZE / 2 + sondes.length * 80,
        }]);
    }, [sondes, saveSondes]);

    const removeSonde = useCallback(
        (id: string) => {
            savePlants(plants.map((p) => p.sondeId === id ? { ...p, sondeId: null } : p));
            saveSondes(sondes.filter((s) => s.id !== id));
        },
        [plants, sondes, savePlants, saveSondes],
    );

    const updateSonde = useCallback(
        (id: string, updates: Partial<Pick<PlacedSonde, "nodeId">>) => {
            saveSondes(sondes.map((s) => (s.id === id ? { ...s, ...updates } : s)));
        },
        [sondes, saveSondes],
    );

    const linkPlantToSonde = useCallback(
        (plantId: string, sondeId: string | null) => {
            savePlants(plants.map((p) => (p.id === plantId ? { ...p, sondeId } : p)));
        },
        [plants, savePlants],
    );

    return { plants, sondes, addPlant, removePlant, updatePlant, addSonde, updateSonde, removeSonde, linkPlantToSonde };
}

function findFreePosition(plants: PlacedPlant[]): { x: number; y: number } {
    const startX = MAP_SIZE / 2 - (GRID_COLS * (DEFAULT_CELL + CELL_GAP)) / 2;
    const startY = MAP_SIZE / 2 - (GRID_ROWS * (DEFAULT_CELL + CELL_GAP)) / 2;
    for (let row = 0; row < GRID_ROWS * 3; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const x = startX + col * (DEFAULT_CELL + CELL_GAP);
            const y = startY + row * (DEFAULT_CELL + CELL_GAP);
            const occupied = plants.some(
                (p) => x < p.x + p.width && x + DEFAULT_CELL > p.x && y < p.y + p.height && y + DEFAULT_CELL > p.y,
            );
            if (!occupied) return { x, y };
        }
    }
    return { x: CELL_GAP, y: CELL_GAP };
}
