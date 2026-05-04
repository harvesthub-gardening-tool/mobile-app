jest.mock("../../app/services/api", () => ({
  gardenClient: {
    getSummary: jest.fn(),
    insertSensorData: jest.fn(),
  },
  getStoredToken: jest.fn().mockResolvedValue("token"),
  API_BASE_URL: "http://localhost:8080",
}));

import { getSummary, listProbesForHubName, insertSensorData } from "../../app/services/gardenService";
import { gardenClient, getStoredToken } from "../../app/services/api";
import { ConnectError, Code } from "@connectrpc/connect";

const mockClient = gardenClient as jest.Mocked<typeof gardenClient>;
const mockGetToken = getStoredToken as jest.Mock;

describe("getSummary", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns summaries on success", async () => {
    const summaries = [{ nodeId: "n1", avgTemperature: 22 }];
    mockClient.getSummary.mockResolvedValue({ summaries } as never);

    const result = await getSummary("n1", 24);
    expect(result).toEqual(summaries);
  });

  it("passes optional params", async () => {
    mockClient.getSummary.mockResolvedValue({ summaries: [] } as never);
    await getSummary("node-abc", 48, "hub-1");
    expect(mockClient.getSummary).toHaveBeenCalledWith({
      nodeId: "node-abc",
      hours: 48,
      hubId: "hub-1",
    });
  });

  it("throws translated error on Unauthenticated", async () => {
    mockClient.getSummary.mockRejectedValue(new ConnectError("unauth", Code.Unauthenticated));
    await expect(getSummary()).rejects.toThrow("Session expirée. Veuillez vous reconnecter.");
  });

  it("throws translated error on NotFound", async () => {
    mockClient.getSummary.mockRejectedValue(new ConnectError("not found", Code.NotFound));
    await expect(getSummary()).rejects.toThrow("Données du capteur introuvables.");
  });

  it("throws translated error on Unavailable", async () => {
    mockClient.getSummary.mockRejectedValue(new ConnectError("down", Code.Unavailable));
    await expect(getSummary()).rejects.toThrow("Le service est temporairement indisponible. Réessayez plus tard.");
  });
});

describe("listProbesForHubName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue("tok");
  });

  it("throws when no token", async () => {
    mockGetToken.mockResolvedValue(null);
    await expect(listProbesForHubName("HubA")).rejects.toThrow(
      "Session expirée. Veuillez vous reconnecter.",
    );
  });

  it("throws when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    await expect(listProbesForHubName("HubA")).rejects.toThrow(
      "Impossible de charger les sondes du hub.",
    );
  });

  it("parses camelCase fields", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          probes: [{ nodeId: "n1", airTemperature: 22.5, airHumidity: 60 }],
        }),
    }) as jest.Mock;
    const result = await listProbesForHubName("HubA");
    expect(result).toEqual([{ nodeId: "n1", airTemperature: 22.5, airHumidity: 60 }]);
  });

  it("parses snake_case fields", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          probes: [{ node_id: "n2", air_temperature: 18, air_humidity: 55 }],
        }),
    }) as jest.Mock;
    const result = await listProbesForHubName("HubA");
    expect(result).toEqual([{ nodeId: "n2", airTemperature: 18, airHumidity: 55 }]);
  });

  it("skips probes without nodeId", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          probes: [
            { nodeId: "n1" },
            { airTemperature: 20 }, // no nodeId → skipped
          ],
        }),
    }) as jest.Mock;
    const result = await listProbesForHubName("HubA");
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe("n1");
  });

  it("handles empty probes array", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ probes: [] }),
    }) as jest.Mock;
    const result = await listProbesForHubName("HubA");
    expect(result).toEqual([]);
  });

  it("handles missing probes key", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }) as jest.Mock;
    const result = await listProbesForHubName("HubA");
    expect(result).toEqual([]);
  });

  it("omits undefined optional fields", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          probes: [{ nodeId: "n3", airTemperature: "invalid", airHumidity: null }],
        }),
    }) as jest.Mock;
    const result = await listProbesForHubName("HubA");
    expect(result[0].airTemperature).toBeUndefined();
    expect(result[0].airHumidity).toBeUndefined();
  });
});

describe("insertSensorData", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls client and returns response", async () => {
    mockClient.insertSensorData.mockResolvedValue({ success: true } as never);
    const data = {
      nodeId: "n1",
      airTemperature: 22,
      airHumidity: 60,
      soilHumidity: 40,
      airPressure: 1013,
      soilTemperature: 18,
      timestamp: BigInt(Date.now()),
    };
    const result = await insertSensorData(data);
    expect(result).toEqual({ success: true });
  });

  it("throws translated error on PermissionDenied", async () => {
    mockClient.insertSensorData.mockRejectedValue(
      new ConnectError("denied", Code.PermissionDenied),
    );
    await expect(
      insertSensorData({
        nodeId: "n1",
        airTemperature: 22,
        airHumidity: 60,
        soilHumidity: 40,
        airPressure: 1013,
        soilTemperature: 18,
        timestamp: BigInt(0),
      }),
    ).rejects.toThrow("Accès non autorisé à ce jardin.");
  });
});
