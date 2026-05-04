import { renderHook, act } from "@testing-library/react-native";

jest.mock("../../app/services/authService", () => ({
  listHubs: jest.fn(),
}));

jest.mock("../../app/services/gardenService", () => ({
  getSummary: jest.fn(),
  listProbesForHubName: jest.fn(),
}));

import { useSensorData } from "../../app/hooks/useSensorData";
import { listHubs } from "../../app/services/authService";
import { getSummary, listProbesForHubName } from "../../app/services/gardenService";

const mockListHubs = listHubs as jest.Mock;
const mockGetSummary = getSummary as jest.Mock;
const mockListProbes = listProbesForHubName as jest.Mock;

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockListHubs.mockResolvedValue([]);
  mockGetSummary.mockResolvedValue([]);
  mockListProbes.mockResolvedValue([]);
});

describe("useSensorData", () => {
  it("returns an empty map initially", async () => {
    const { result } = renderHook(() => useSensorData());
    await flush();
    expect(result.current).toBeInstanceOf(Map);
    expect(result.current.size).toBe(0);
  });

  it("builds map from probes and summaries", async () => {
    mockListHubs.mockResolvedValue([{ hubName: "Hub A", id: "hub-1" }]);
    mockListProbes.mockResolvedValue([{ nodeId: "n1", airTemperature: 22.5, airHumidity: 60 }]);
    mockGetSummary.mockResolvedValue([{
      nodeId: "n1",
      intervalStart: BigInt(1000),
      avgAirTemperature: 21,
      avgAirHumidity: 55,
      avgSoilHumidity: 30,
      avgSoilTemperature: 18,
    }]);

    const { result } = renderHook(() => useSensorData());
    await flush();

    expect(result.current.size).toBe(1);
    const data = result.current.get("n1");
    expect(data?.airTemperature).toBe(22.5);
    expect(data?.airHumidity).toBe(60);
    expect(data?.soilHumidity).toBe(30);
    expect(data?.soilTemperature).toBe(18);
  });

  it("uses summary values when probe lacks them", async () => {
    mockListHubs.mockResolvedValue([{ hubName: "H", id: "1" }]);
    mockListProbes.mockResolvedValue([{ nodeId: "n2" }]);
    mockGetSummary.mockResolvedValue([{
      nodeId: "n2",
      intervalStart: BigInt(1000),
      avgAirTemperature: 19,
      avgAirHumidity: 50,
      avgSoilHumidity: 25,
      avgSoilTemperature: 15,
    }]);

    const { result } = renderHook(() => useSensorData());
    await flush();

    const data = result.current.get("n2");
    expect(data?.airTemperature).toBe(19);
    expect(data?.airHumidity).toBe(50);
  });

  it("picks latest summary per node when multiple rows", async () => {
    mockListHubs.mockResolvedValue([{ hubName: "H", id: "1" }]);
    mockListProbes.mockResolvedValue([{ nodeId: "n3" }]);
    mockGetSummary.mockResolvedValue([
      { nodeId: "n3", intervalStart: BigInt(500), avgAirTemperature: 10, avgAirHumidity: 40, avgSoilHumidity: 0, avgSoilTemperature: 0 },
      { nodeId: "n3", intervalStart: BigInt(2000), avgAirTemperature: 25, avgAirHumidity: 70, avgSoilHumidity: 0, avgSoilTemperature: 0 },
    ]);

    const { result } = renderHook(() => useSensorData());
    await flush();

    expect(result.current.get("n3")?.airTemperature).toBe(25);
  });

  it("silently ignores errors", async () => {
    mockListHubs.mockRejectedValue(new Error("no connection"));

    const { result } = renderHook(() => useSensorData());
    await flush();

    expect(result.current.size).toBe(0);
  });

  it("polls every 30 seconds", async () => {
    jest.useFakeTimers();
    mockListHubs.mockResolvedValue([]);

    renderHook(() => useSensorData());
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(mockListHubs).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(30_000);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockListHubs).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it("clears interval on unmount", async () => {
    jest.useFakeTimers();
    mockListHubs.mockResolvedValue([]);

    const { unmount } = renderHook(() => useSensorData());
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(30_000);
      await Promise.resolve();
    });
    expect(mockListHubs).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
