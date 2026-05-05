import { withAlpha, colors } from "../../app/theme/colors";

describe("withAlpha", () => {
  it("returns rgba for valid 6-char hex", () => {
    expect(withAlpha("#ff0000", 1)).toBe("rgba(255,0,0,1)");
    expect(withAlpha("#000000", 0)).toBe("rgba(0,0,0,0)");
    expect(withAlpha("#ffffff", 0.5)).toBe("rgba(255,255,255,0.5)");
  });

  it("expands 3-char hex shorthand", () => {
    expect(withAlpha("#fff", 1)).toBe("rgba(255,255,255,1)");
    expect(withAlpha("#f00", 0.5)).toBe("rgba(255,0,0,0.5)");
    expect(withAlpha("#0f0", 0.25)).toBe("rgba(0,255,0,0.25)");
  });

  it("clamps alpha to [0, 1]", () => {
    expect(withAlpha("#ff0000", 2)).toBe("rgba(255,0,0,1)");
    expect(withAlpha("#ff0000", -1)).toBe("rgba(255,0,0,0)");
  });

  it("returns original value for invalid hex length", () => {
    expect(withAlpha("#ff00", 0.5)).toBe("#ff00");
    expect(withAlpha("notahex", 0.5)).toBe("notahex");
  });

  it("handles hex without leading #", () => {
    expect(withAlpha("ff0000", 1)).toBe("rgba(255,0,0,1)");
  });
});

describe("colors", () => {
  it("has expected top-level keys", () => {
    expect(colors).toHaveProperty("brand");
    expect(colors).toHaveProperty("surface");
    expect(colors).toHaveProperty("state");
    expect(colors).toHaveProperty("garden");
  });

  it("brand accent is the green", () => {
    expect(colors.brand.accent).toBe("#173124");
  });

  it("garden map color is set", () => {
    expect(colors.garden.map).toBe("#5e7a57");
    expect(colors.garden.mapBorder).toBe("#ad9579");
  });
});
