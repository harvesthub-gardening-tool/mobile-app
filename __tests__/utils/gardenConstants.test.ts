import {
  MAP_SIZE,
  DEFAULT_CELL,
  MIN_CARD_SIZE,
  MAX_SONDES,
  PLANT_CATALOG,
  GRASS_DECORATIONS,
  GRID_COLS,
  GRID_ROWS,
  CELL_GAP,
  MIN_SCALE,
  MAX_SCALE,
} from "../../app/constants/garden";

describe("garden constants", () => {
  it("MAP_SIZE is a positive number", () => {
    expect(MAP_SIZE).toBeGreaterThan(0);
  });

  it("DEFAULT_CELL >= MIN_CARD_SIZE", () => {
    expect(DEFAULT_CELL).toBeGreaterThanOrEqual(MIN_CARD_SIZE);
  });

  it("MAX_SONDES is positive", () => {
    expect(MAX_SONDES).toBeGreaterThan(0);
  });

  it("MIN_SCALE < MAX_SCALE", () => {
    expect(MIN_SCALE).toBeLessThan(MAX_SCALE);
  });

  it("GRID_COLS and GRID_ROWS are positive", () => {
    expect(GRID_COLS).toBeGreaterThan(0);
    expect(GRID_ROWS).toBeGreaterThan(0);
  });

  it("CELL_GAP is non-negative", () => {
    expect(CELL_GAP).toBeGreaterThanOrEqual(0);
  });
});

describe("PLANT_CATALOG", () => {
  it("has plants", () => {
    expect(PLANT_CATALOG.length).toBeGreaterThan(0);
  });

  it("each plant has required fields", () => {
    for (const plant of PLANT_CATALOG) {
      expect(typeof plant.id).toBe("string");
      expect(plant.id.length).toBeGreaterThan(0);
      expect(typeof plant.name).toBe("string");
      expect(plant.name.length).toBeGreaterThan(0);
      expect(typeof plant.emoji).toBe("string");
      expect(["fruit", "legume", "herbe"]).toContain(plant.category);
    }
  });

  it("all IDs are unique", () => {
    const ids = PLANT_CATALOG.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("has all three categories", () => {
    const cats = new Set(PLANT_CATALOG.map((p) => p.category));
    expect(cats.has("fruit")).toBe(true);
    expect(cats.has("legume")).toBe(true);
    expect(cats.has("herbe")).toBe(true);
  });
});

describe("GRASS_DECORATIONS", () => {
  it("generates decorations", () => {
    expect(GRASS_DECORATIONS.length).toBeGreaterThan(0);
  });

  it("each decoration has x, y, emoji, size", () => {
    for (const d of GRASS_DECORATIONS) {
      expect(typeof d.x).toBe("number");
      expect(typeof d.y).toBe("number");
      expect(typeof d.emoji).toBe("string");
      expect(typeof d.size).toBe("number");
      expect(d.size).toBeGreaterThan(0);
    }
  });
});
