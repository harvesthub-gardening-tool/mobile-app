import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { STORAGE_KEY, DEFAULT_CELL, MAP_SIZE, GRID_COLS, GRID_ROWS, CELL_GAP } from "../constants/garden";
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
          setPlants(JSON.parse(data));
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
          setSondes(JSON.parse(data));
        } catch {
          setSondes([]);
        }
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
    (plantType: PlantType, sondeId: string | null) => {
      const pos = findFreePosition(plants);
      const newPlant: PlacedPlant = {
        id: `placed_${++plantIdCounter}`,
        plantType,
        x: pos.x,
        y: pos.y,
        size: DEFAULT_CELL,
        quantity: 1,
        sondeId,
      };
      savePlants([...plants, newPlant]);
    },
    [plants, savePlants],
  );

  const removePlant = useCallback(
    (id: string) => {
      savePlants(plants.filter((p) => p.id !== id));
    },
    [plants, savePlants],
  );

  const updatePlant = useCallback(
    (id: string, updates: Partial<Pick<PlacedPlant, "x" | "y" | "size" | "quantity" | "sondeId">>) => {
      savePlants(plants.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    },
    [plants, savePlants],
  );

  const addSonde = useCallback(
    (type: { id: string; name: string }) => {
      const alreadyExists = sondes.some((s) => s.name === type.name);
      if (alreadyExists) return;
      const startX = MAP_SIZE / 2;
      const startY = MAP_SIZE / 2 + sondes.length * 80;
      saveSondes([
        ...sondes,
        { id: `sonde_${Date.now()}`, name: type.name, x: startX, y: startY },
      ]);
    },
    [sondes, saveSondes],
  );

  const removeSonde = useCallback(
    (id: string) => {
      savePlants(plants.map((p) => (p.sondeId === id ? { ...p, sondeId: null } : p)));
      saveSondes(sondes.filter((s) => s.id !== id));
    },
    [plants, sondes, savePlants, saveSondes],
  );

  const linkPlantToSonde = useCallback(
    (plantId: string, sondeId: string | null) => {
      savePlants(plants.map((p) => (p.id === plantId ? { ...p, sondeId } : p)));
    },
    [plants, savePlants],
  );

  return {
    plants,
    sondes,
    addPlant,
    removePlant,
    updatePlant,
    addSonde,
    removeSonde,
    linkPlantToSonde,
  };
}

function findFreePosition(plants: PlacedPlant[]): { x: number; y: number } {
  const startX = MAP_SIZE / 2 - (GRID_COLS * (DEFAULT_CELL + CELL_GAP)) / 2;
  const startY = MAP_SIZE / 2 - (GRID_ROWS * (DEFAULT_CELL + CELL_GAP)) / 2;
  for (let row = 0; row < GRID_ROWS * 3; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = startX + col * (DEFAULT_CELL + CELL_GAP);
      const y = startY + row * (DEFAULT_CELL + CELL_GAP);
      const occupied = plants.some(
        (p) =>
          x < p.x + p.size &&
          x + DEFAULT_CELL > p.x &&
          y < p.y + p.size &&
          y + DEFAULT_CELL > p.y,
      );
      if (!occupied) return { x, y };
    }
  }
  return { x: CELL_GAP, y: CELL_GAP };
}
