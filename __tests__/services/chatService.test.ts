import { buildPlantContext } from "../../src/services/chatService";
import type { PlacedPlant, PlacedSonde } from "../../src/types/garden";

describe("chatService", () => {
  it("builds plant context with linked probe node ids", () => {
    const sondes: PlacedSonde[] = [
      { id: "sonde-1", x: 0, y: 0, nodeId: "node-1", hubName: "Hub" },
    ];
    const plants: PlacedPlant[] = [
      {
        id: "plant-1",
        plantType: { id: "tomato", name: "Tomate", emoji: "", category: "legume" },
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        quantity: 2,
        sondeId: "sonde-1",
      },
    ];

    expect(buildPlantContext(plants, sondes)).toEqual([
      {
        $typeName: "chat.v1.ChatPlantContext",
        id: "plant-1",
        name: "Tomate",
        quantity: 2,
        probeNodeId: "node-1",
      },
    ]);
  });
});
