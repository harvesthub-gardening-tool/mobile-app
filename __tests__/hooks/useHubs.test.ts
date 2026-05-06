import { renderHook, act, waitFor } from "@testing-library/react-native";

jest.mock("../../src/services/authService", () => ({
  listHubs: jest.fn(),
}));

import { useHubs } from "../../src/hooks/useHubs";
import { listHubs } from "../../src/services/authService";

const mockListHubs = listHubs as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("useHubs", () => {
  it("starts loading", () => {
    mockListHubs.mockResolvedValue([]);
    const { result } = renderHook(() => useHubs());
    expect(result.current.loading).toBe(true);
    return waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("loads hubs on mount", async () => {
    const hubs = [{ hubName: "Hub A", id: "1" }, { hubName: "Hub B", id: "2" }];
    mockListHubs.mockResolvedValue(hubs);

    const { result } = renderHook(() => useHubs());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.hubs).toEqual(hubs);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on failure", async () => {
    mockListHubs.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useHubs());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.hubs).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Network error");
  });

  it("sets generic error for non-Error rejection", async () => {
    mockListHubs.mockRejectedValue("oops");

    const { result } = renderHook(() => useHubs());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBe("Impossible de charger les hubs.");
  });

  it("refresh re-fetches hubs", async () => {
    mockListHubs.mockResolvedValue([]);
    const { result } = renderHook(() => useHubs());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const newHubs = [{ hubName: "Hub X", id: "99" }];
    mockListHubs.mockResolvedValue(newHubs);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.hubs).toEqual(newHubs);
  });
});
