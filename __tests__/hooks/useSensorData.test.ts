import { renderHook, act } from "@testing-library/react-native";

jest.mock("../../app/services/authService", () => ({
  listHubs: jest.fn(),
}));

jest.mock("../../app/services/gardenService", () => ({
  getLast: jest.fn(),
  listProbesForHubName: jest.fn(),
}));

import { useSensorData } from "../../app/hooks/useSensorData";
import { listHubs } from "../../app/services/authService";
import { getLast, listProbesForHubName } from "../../app/services/gardenService";

const mockListHubs = listHubs as jest.Mock;
const mockGetLast = getLast as jest.Mock;
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
  mockGetLast.mockResolvedValue(null);
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
    mockListHubs.mockResolvedValue([{ hubName: "Hub A", id: "hub-1", claimed: true, revoked: false }]);
    mockListProbes.mockResolvedValue([{ nodeId: "n1", airTemperature: 22.5, airHumidity: 60 }]);
    mockGetLast.mockResolvedValue({ soilHumidity: 30, soilTemperature: 18 });

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
    mockListHubs.mockResolvedValue([{ hubName: "H", id: "1", claimed: true, revoked: false }]);
    mockListProbes.mockResolvedValue([{ nodeId: "n2" }]);
    mockGetLast.mockResolvedValue({
      airTemperature: 19,
      airHumidity: 50,
      soilHumidity: 25,
      soilTemperature: 15,
    });

    const { result } = renderHook(() => useSensorData());
    await flush();

    const data = result.current.get("n2");
    expect(data?.airTemperature).toBe(19);
    expect(data?.airHumidity).toBe(50);
  });

  it("uses the latest reading per node", async () => {
    mockListHubs.mockResolvedValue([{ hubName: "H", id: "1", claimed: true, revoked: false }]);
    mockListProbes.mockResolvedValue([{ nodeId: "n3" }]);
    mockGetLast.mockResolvedValue({ airTemperature: 25, airHumidity: 70, soilHumidity: 0, soilTemperature: 0 });

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
