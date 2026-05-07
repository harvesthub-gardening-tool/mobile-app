import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { MotorCommandStatus } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../app/context/AuthContext", () => ({
  useAuth: () => ({ userId: "user_1" }),
}));

import { useAlertMotorSummaries } from "../../app/hooks/useAlertMotorSummaries";

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("useAlertMotorSummaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(null);
    mockStorage.setItem.mockResolvedValue(undefined);
  });

  it("loads persisted summaries on first render", async () => {
    mockStorage.getItem.mockResolvedValue(JSON.stringify({
      "plant-dry": {
        commandId: "cmd-restored",
        status: MotorCommandStatus.SUCCEEDED,
        observedAt: 1778144700000,
        message: "Arrosage terminé avec succès.",
      },
    }));

    const { result } = renderHook(() => useAlertMotorSummaries());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    expect(mockStorage.getItem).toHaveBeenCalledWith("harvest_hub_alert_motor_summaries_user_1");
    expect(result.current.summaries["plant-dry"]?.commandId).toBe("cmd-restored");
    expect(result.current.summaries["plant-dry"]?.status).toBe(MotorCommandStatus.SUCCEEDED);
  });

  it("persists updates per plant", async () => {
    const { result } = renderHook(() => useAlertMotorSummaries());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    act(() => {
      result.current.setSummary("plant-dry", {
        commandId: "cmd-success",
        status: MotorCommandStatus.SUCCEEDED,
        observedAt: 1778148900000,
        message: "Arrosage terminé avec succès.",
      });
    });

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "harvest_hub_alert_motor_summaries_user_1",
      JSON.stringify({
        "plant-dry": {
          commandId: "cmd-success",
          status: MotorCommandStatus.SUCCEEDED,
          observedAt: 1778148900000,
          message: "Arrosage terminé avec succès.",
        },
      }),
    );
    expect(result.current.summaries["plant-dry"]?.commandId).toBe("cmd-success");
  });

  it("clears a persisted summary when asked", async () => {
    mockStorage.getItem.mockResolvedValue(JSON.stringify({
      "plant-dry": {
        commandId: "cmd-restored",
        status: MotorCommandStatus.SUCCEEDED,
        observedAt: 1778144700000,
        message: "Arrosage terminé avec succès.",
      },
    }));

    const { result } = renderHook(() => useAlertMotorSummaries());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    act(() => {
      result.current.setSummary("plant-dry", null);
    });

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "harvest_hub_alert_motor_summaries_user_1",
      JSON.stringify({}),
    );
    expect(result.current.summaries["plant-dry"]).toBeUndefined();
  });
});
