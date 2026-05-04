import { getSondeDisplayName } from "../../app/utils/sondeDisplay";
import type { PlacedSonde } from "../../app/types/garden";

const makeSonde = (id: string, hubName: string): PlacedSonde => ({
  id,
  x: 0,
  y: 0,
  nodeId: `node-${id}`,
  hubName,
});

describe("getSondeDisplayName", () => {
  it("returns 'Hub 1' for first sonde in a hub", () => {
    const s1 = makeSonde("s1", "Hub A");
    expect(getSondeDisplayName(s1, [s1])).toBe("Hub A 1");
  });

  it("increments index per hub", () => {
    const s1 = makeSonde("s1", "Hub A");
    const s2 = makeSonde("s2", "Hub A");
    const s3 = makeSonde("s3", "Hub A");
    const all = [s1, s2, s3];
    expect(getSondeDisplayName(s1, all)).toBe("Hub A 1");
    expect(getSondeDisplayName(s2, all)).toBe("Hub A 2");
    expect(getSondeDisplayName(s3, all)).toBe("Hub A 3");
  });

  it("isolates indices per hub", () => {
    const s1 = makeSonde("s1", "Hub A");
    const s2 = makeSonde("s2", "Hub B");
    const s3 = makeSonde("s3", "Hub B");
    const all = [s1, s2, s3];
    expect(getSondeDisplayName(s1, all)).toBe("Hub A 1");
    expect(getSondeDisplayName(s2, all)).toBe("Hub B 1");
    expect(getSondeDisplayName(s3, all)).toBe("Hub B 2");
  });

  it("falls back to 'Hub' for empty hubName", () => {
    const s1 = makeSonde("s1", "");
    const s2 = makeSonde("s2", "   ");
    const all = [s1, s2];
    expect(getSondeDisplayName(s1, all)).toBe("Hub 1");
    expect(getSondeDisplayName(s2, all)).toBe("Hub 2");
  });

  it("trims whitespace in hub name", () => {
    const s1 = makeSonde("s1", "  My Hub  ");
    expect(getSondeDisplayName(s1, [s1])).toBe("My Hub 1");
  });
});
