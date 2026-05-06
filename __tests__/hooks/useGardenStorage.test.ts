import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook, act } from "@testing-library/react-native";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../app/context/AuthContext", () => ({
  useAuth: () => ({ userId: "user_1" }),
}));

import { useGardenStorage } from "../../app/hooks/useGardenStorage";

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const PLANT_TYPE = {
  id: "t1",
  name: "Tomate",
  emoji: "🍅",
  category: "legume" as const,
};

async function waitForStorage() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStorage.getItem.mockResolvedValue(null);
  mockStorage.setItem.mockResolvedValue(undefined);
});

// ── Initial state ────────────────────────────────────────────────

describe("initial state", () => {
  it("starts with empty plants and sondes", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();
    expect(result.current.plants).toEqual([]);
    expect(result.current.sondes).toEqual([]);
  });

  it("loads plants from storage", async () => {
    const stored = [
      {
        id: "placed_1",
        plantType: PLANT_TYPE,
        x: 10, y: 20, width: 140, height: 140,
        quantity: 2, sondeId: null,
      },
    ];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(
        key.includes("garden_plants") && !key.includes("sondes")
          ? JSON.stringify(stored)
          : null,
      ),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();
    expect(result.current.plants).toHaveLength(1);
    expect(result.current.plants[0].plantType.name).toBe("Tomate");
  });

  it("loads sondes from storage (with valid nodeId)", async () => {
    const stored = [
      { id: "s1", x: 100, y: 100, nodeId: "node-abc", hubName: "Hub A" },
    ];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(key.includes("_sondes") ? JSON.stringify(stored) : null),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();
    expect(result.current.sondes).toHaveLength(1);
    expect(result.current.sondes[0].nodeId).toBe("node-abc");
  });
});

// ── addPlant ────────────────────────────────────────────────────

describe("addPlant", () => {
  it("adds a plant with correct defaults", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlant(PLANT_TYPE); });

    expect(result.current.plants).toHaveLength(1);
    expect(result.current.plants[0].plantType).toEqual(PLANT_TYPE);
    expect(result.current.plants[0].quantity).toBe(1);
    expect(result.current.plants[0].sondeId).toBeNull();
    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it("places two plants at different positions", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlant(PLANT_TYPE); });
    act(() => { result.current.addPlant(PLANT_TYPE); });

    const [p1, p2] = result.current.plants;
    expect(p1.x === p2.x && p1.y === p2.y).toBe(false);
  });

  it("returns the created plant", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    let created: ReturnType<typeof result.current.addPlant>;
    act(() => { created = result.current.addPlant(PLANT_TYPE); });
    expect(created!.id).toBeTruthy();
    expect(created!.plantType).toEqual(PLANT_TYPE);
  });
});

// ── addPlantForSonde ────────────────────────────────────────────

describe("addPlantForSonde", () => {
  it("adds a plant pre-linked to a sonde", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlantForSonde(PLANT_TYPE, "sonde_id_1"); });

    expect(result.current.plants[0].sondeId).toBe("sonde_id_1");
  });

  it("uses provided position", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlantForSonde(PLANT_TYPE, "s1", { x: 300, y: 400 }); });

    expect(result.current.plants[0].x).toBe(300);
    expect(result.current.plants[0].y).toBe(400);
  });
});

// ── removePlant ─────────────────────────────────────────────────

describe("removePlant", () => {
  it("removes a plant by id", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlant(PLANT_TYPE); });
    const id = result.current.plants[0].id;
    act(() => { result.current.removePlant(id); });

    expect(result.current.plants).toHaveLength(0);
  });

  it("does nothing for unknown id", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlant(PLANT_TYPE); });
    act(() => { result.current.removePlant("unknown"); });

    expect(result.current.plants).toHaveLength(1);
  });

  it("auto-removes sonde when last linked plant is deleted", async () => {
    const stored = [{ id: "s1", x: 0, y: 0, nodeId: "node-1", hubName: "Hub" }];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(key.includes("_sondes") ? JSON.stringify(stored) : null),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlantForSonde(PLANT_TYPE, "s1"); });
    const plantId = result.current.plants[0].id;

    act(() => { result.current.removePlant(plantId); });

    expect(result.current.plants).toHaveLength(0);
    expect(result.current.sondes).toHaveLength(0);
  });
});

// ── updatePlant ─────────────────────────────────────────────────

describe("updatePlant", () => {
  it("updates quantity, x, y", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlant(PLANT_TYPE); });
    const id = result.current.plants[0].id;
    act(() => { result.current.updatePlant(id, { quantity: 5, x: 100, y: 200 }); });

    expect(result.current.plants[0].quantity).toBe(5);
    expect(result.current.plants[0].x).toBe(100);
    expect(result.current.plants[0].y).toBe(200);
  });

  it("does not modify other plants", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlant(PLANT_TYPE); });
    act(() => { result.current.addPlant(PLANT_TYPE); });
    const id = result.current.plants[0].id;

    act(() => { result.current.updatePlant(id, { quantity: 10 }); });

    expect(result.current.plants[1].quantity).toBe(1);
  });
});

// ── addSonde ────────────────────────────────────────────────────

describe("addSonde", () => {
  it("returns null when no nodeId given", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    let ret: ReturnType<typeof result.current.addSonde>;
    act(() => { ret = result.current.addSonde(); });

    expect(ret!).toBeNull();
    expect(result.current.sondes).toHaveLength(0);
  });

  it("creates sonde with nodeId, hubId, and hubName", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addSonde({ nodeId: "node-1", hubId: "42", hubName: "My Hub" }); });

    expect(result.current.sondes).toHaveLength(1);
    expect(result.current.sondes[0].nodeId).toBe("node-1");
    expect(result.current.sondes[0].hubId).toBe("42");
    expect(result.current.sondes[0].hubName).toBe("My Hub");
  });

  it("defaults hubName to 'Hub' when empty", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addSonde({ nodeId: "n1", hubName: "" }); });

    expect(result.current.sondes[0].hubName).toBe("Hub");
  });

  it("returns existing sonde if nodeId already registered", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addSonde({ nodeId: "n1" }); });
    const firstId = result.current.sondes[0].id;

    let ret: ReturnType<typeof result.current.addSonde>;
    act(() => { ret = result.current.addSonde({ nodeId: "n1" }); });

    expect(ret!.id).toBe(firstId);
    expect(result.current.sondes).toHaveLength(1);
  });
});

// ── removeSonde ─────────────────────────────────────────────────

describe("removeSonde", () => {
  it("removes sonde and unlinks plants", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addSonde({ nodeId: "n1" }); });
    const sondeId = result.current.sondes[0].id;

    act(() => { result.current.addPlant(PLANT_TYPE); });
    const plantId = result.current.plants[0].id;
    act(() => { result.current.linkPlantToSonde(plantId, sondeId); });

    act(() => { result.current.removeSonde(sondeId); });

    expect(result.current.sondes).toHaveLength(0);
    expect(result.current.plants[0].sondeId).toBeNull();
  });
});

// ── linkPlantToSonde ────────────────────────────────────────────

describe("linkPlantToSonde", () => {
  it("links a plant to a sonde", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlant(PLANT_TYPE); });
    act(() => { result.current.addSonde({ nodeId: "n1" }); });
    const plantId = result.current.plants[0].id;
    const sondeId = result.current.sondes[0].id;

    act(() => { result.current.linkPlantToSonde(plantId, sondeId); });

    expect(result.current.plants[0].sondeId).toBe(sondeId);
  });

  it("unlinks (null) a plant from its sonde", async () => {
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    act(() => { result.current.addPlant(PLANT_TYPE); });
    act(() => { result.current.addSonde({ nodeId: "n1" }); });
    const plantId = result.current.plants[0].id;
    const sondeId = result.current.sondes[0].id;

    act(() => { result.current.linkPlantToSonde(plantId, sondeId); });
    act(() => { result.current.linkPlantToSonde(plantId, null); });

    expect(result.current.plants[0].sondeId).toBeNull();
  });
});

// ── Migration ────────────────────────────────────────────────────

describe("migration", () => {
  it("migrates size → width/height", async () => {
    const legacy = [
      { id: "p1", plantType: PLANT_TYPE, x: 0, y: 0, size: 200, quantity: 1, sondeId: null },
    ];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(
        key.includes("garden_plants") && !key.includes("sondes")
          ? JSON.stringify(legacy)
          : null,
      ),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    expect(result.current.plants[0].width).toBe(200);
    expect(result.current.plants[0].height).toBe(200);
  });

  it("migrates sondeIds[] → sondeId (first element)", async () => {
    const legacy = [
      { id: "p1", plantType: PLANT_TYPE, x: 0, y: 0, width: 140, height: 140, quantity: 1, sondeIds: ["s1", "s2"] },
    ];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(
        key.includes("garden_plants") && !key.includes("sondes")
          ? JSON.stringify(legacy)
          : null,
      ),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    expect(result.current.plants[0].sondeId).toBe("s1");
  });

  it("sets sondeId null when sondeIds is empty", async () => {
    const legacy = [
      { id: "p1", plantType: PLANT_TYPE, x: 0, y: 0, width: 140, height: 140, quantity: 1, sondeIds: [] },
    ];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(
        key.includes("garden_plants") && !key.includes("sondes")
          ? JSON.stringify(legacy)
          : null,
      ),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    expect(result.current.plants[0].sondeId).toBeNull();
  });

  it("filters out sondes with empty nodeId", async () => {
    const legacy = [
      { id: "s1", x: 0, y: 0, nodeId: "node-1", hubName: "Hub" },
      { id: "s2", x: 0, y: 0, nodeId: "", hubName: "Hub" },
    ];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(key.includes("_sondes") ? JSON.stringify(legacy) : null),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    expect(result.current.sondes).toHaveLength(1);
    expect(result.current.sondes[0].nodeId).toBe("node-1");
  });

  it("defaults sonde hubName to 'Hub' when missing", async () => {
    const legacy = [
      { id: "s1", x: 0, y: 0, nodeId: "n1" },
    ];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(key.includes("_sondes") ? JSON.stringify(legacy) : null),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    expect(result.current.sondes[0].hubName).toBe("Hub");
  });

  it("preserves missing legacy sonde hubId as undefined", async () => {
    const legacy = [
      { id: "s1", x: 0, y: 0, nodeId: "n1", hubName: "Hub" },
    ];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(key.includes("_sondes") ? JSON.stringify(legacy) : null),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    expect(result.current.sondes[0].hubId).toBeUndefined();
  });

  it("clamps migrated size to MIN_CARD_SIZE", async () => {
    const legacy = [
      { id: "p1", plantType: PLANT_TYPE, x: 0, y: 0, size: 10, quantity: 1, sondeId: null },
    ];
    mockStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(
        key.includes("garden_plants") && !key.includes("sondes")
          ? JSON.stringify(legacy)
          : null,
      ),
    );
    const { result } = renderHook(() => useGardenStorage());
    await waitForStorage();

    expect(result.current.plants[0].width).toBeGreaterThanOrEqual(80);
  });
});
