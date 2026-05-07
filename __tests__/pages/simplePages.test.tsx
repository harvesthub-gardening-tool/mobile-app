import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { MotorCommandStatus } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";

const mockUseGardenStorage = jest.fn();
const mockUseAlertMotorSummaries = jest.fn();
const mockUseSensorData = jest.fn();
const mockCreateMotorCommand = jest.fn();
const mockPollMotorCommandStatus = jest.fn();

jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  useSegments: () => [],
}));
jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({ logout: jest.fn(), refreshToken: jest.fn(), userId: "u1", token: "tok", isAuthenticated: true }),
}));
jest.mock("../../src/hooks/useHubs", () => ({
  useHubs: () => ({ hubs: [], loading: false, error: null, refresh: jest.fn() }),
}));
jest.mock("@/hooks/useGardenStorage", () => ({
  useGardenStorage: () => mockUseGardenStorage(),
}));
jest.mock("@/hooks/useAlertMotorSummaries", () => ({
  useAlertMotorSummaries: () => mockUseAlertMotorSummaries(),
}));
jest.mock("@/hooks/useSensorData", () => ({
  useSensorData: () => mockUseSensorData(),
}));
jest.mock("@/services/controlService", () => ({
  createMotorCommand: (...args: unknown[]) => mockCreateMotorCommand(...args),
  getMotorReasonPresentation: jest.fn(() => null),
  pollMotorCommandStatus: (...args: unknown[]) => mockPollMotorCommandStatus(...args),
}));
jest.mock("@/services/authService", () => ({
  listHubs: jest.fn().mockResolvedValue([]),
  changeEmail: jest.fn().mockResolvedValue({ token: "token" }),
  changePassword: jest.fn().mockResolvedValue(undefined),
}));

import Alerts from "../../app/pages/alerts";
import Chat from "../../app/pages/chat";
import Profile from "../../app/pages/profile";
import Hubs from "../../app/pages/hubs";

describe("Alerts page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAlertMotorSummaries.mockReturnValue({
      summaries: {},
      loaded: true,
      setSummary: jest.fn(),
    });
    mockUseGardenStorage.mockReturnValue({
      plants: [
        {
          id: "plant-dry",
          plantType: { id: "tomato", name: "Tomate", emoji: "🍅", category: "fruit" },
          x: 0,
          y: 0,
          width: 80,
          height: 80,
          quantity: 2,
          sondeId: "sonde-dry",
        },
        {
          id: "plant-watered",
          plantType: { id: "basil", name: "Basilic", emoji: "🌿", category: "herbe" },
          x: 20,
          y: 20,
          width: 80,
          height: 80,
          quantity: 1,
          sondeId: "sonde-watered",
        },
      ],
      sondes: [
        { id: "sonde-dry", x: 0, y: 0, nodeId: "node-dry", hubId: "hub-nord", hubName: "Hub Nord" },
        { id: "sonde-watered", x: 0, y: 0, nodeId: "node-watered", hubId: "hub-sud", hubName: "Hub Sud" },
      ],
    });
    mockUseSensorData.mockReturnValue(
      new Map([
        ["node-dry", { soilHumidity: 24, soilTemperature: 18.4 }],
        ["node-watered", { soilHumidity: 55, soilTemperature: 19.2 }],
      ]),
    );
    mockCreateMotorCommand.mockResolvedValue({ command: null });
    mockPollMotorCommandStatus.mockResolvedValue({ command: null, isTerminal: true, timedOut: false });
  });

  it("renders without crashing", () => {
    const { getByText, toJSON } = render(<Alerts />);

    expect(getByText("Alertes")).toBeTruthy();
    expect(toJSON()).toBeTruthy();
  });

  it("shows French water statuses from linked probe data", () => {
    const { getByText } = render(<Alerts />);

    expect(getByText("Tomate")).toBeTruthy();
    expect(getByText("Basilic")).toBeTruthy();
    expect(getByText("À arroser")).toBeTruthy();
    expect(getByText("Arrosée")).toBeTruthy();
    expect(getByText("24%")).toBeTruthy();
    expect(getByText("55%")).toBeTruthy();
    expect(getByText(/Rafraîchissement automatique toutes les 30 secondes/)).toBeTruthy();
  });

  it("shows dry alerts even when sensor values are zero", () => {
    mockUseSensorData.mockReturnValue(new Map([
      ["node-dry", { soilHumidity: 0, soilTemperature: 0 }],
      ["node-watered", { soilHumidity: 55, soilTemperature: 19.2 }],
    ]));

    const { getByText } = render(<Alerts />);

    expect(getByText("À arroser")).toBeTruthy();
    expect(getByText("0%")).toBeTruthy();
    expect(getByText("0.0°C")).toBeTruthy();
  });

  it("shows watering only for dry alert cards", async () => {
    const { findAllByText, getByTestId } = render(<Alerts />);

    expect(await findAllByText("Arroser")).toHaveLength(1);
    expect(within(getByTestId("plant-water-status-plant-dry")).getByText("Arroser")).toBeTruthy();
    expect(within(getByTestId("plant-water-status-plant-watered")).queryByText("Arroser")).toBeNull();
  });

  it("hides watering when the linked sonde has no hub id", () => {
    mockUseGardenStorage.mockReturnValue({
      plants: [
        {
          id: "plant-dry",
          plantType: { id: "tomato", name: "Tomate", emoji: "🍅", category: "fruit" },
          x: 0,
          y: 0,
          width: 80,
          height: 80,
          quantity: 2,
          sondeId: "sonde-dry",
        },
      ],
      sondes: [{ id: "sonde-dry", x: 0, y: 0, nodeId: "node-dry", hubName: "Hub Nord" }],
    });

    const { queryByText } = render(<Alerts />);

    expect(queryByText("Arroser")).toBeNull();
  });

  it("triggers watering from an alert card with the linked hub and node", async () => {
    const { findAllByText } = render(<Alerts />);

    fireEvent.press((await findAllByText("Arroser"))[0]);

    await waitFor(() => {
      expect(mockCreateMotorCommand).toHaveBeenCalledWith("hub-nord", "node-dry", 3000);
    });
  });

  it("unlocks the alert watering action when polling times out", async () => {
    mockCreateMotorCommand.mockResolvedValue({
      command: {
        commandId: "cmd-timeout",
        status: MotorCommandStatus.QUEUED,
      },
    });
    mockPollMotorCommandStatus.mockResolvedValue({
      command: {
        commandId: "cmd-timeout",
        status: MotorCommandStatus.QUEUED,
      },
      isTerminal: false,
      timedOut: true,
    });

    const { findAllByText, getByText } = render(<Alerts />);

    fireEvent.press((await findAllByText("Arroser"))[0]);

    await waitFor(() => {
      expect(getByText("La commande prend plus de temps que prévu. Vous pouvez réessayer dans quelques instants.")).toBeTruthy();
    });
    expect(await findAllByText("Arroser")).toHaveLength(1);
  });

  it("shows watering success with observed time on the alert card", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(new Date("2026-05-07T10:15:00.000Z").getTime());
    mockCreateMotorCommand.mockResolvedValue({
      command: {
        commandId: "cmd-success",
        status: MotorCommandStatus.QUEUED,
      },
    });
    mockPollMotorCommandStatus.mockResolvedValue({
      command: {
        commandId: "cmd-success",
        status: MotorCommandStatus.SUCCEEDED,
      },
      isTerminal: true,
      timedOut: false,
    });

    const { findAllByText, getByText } = render(<Alerts />);

    fireEvent.press((await findAllByText("Arroser"))[0]);

    await waitFor(() => {
      expect(getByText(/Arrosage terminé avec succès\./)).toBeTruthy();
      expect(getByText(/10:15|12:15/)).toBeTruthy();
    });

    nowSpy.mockRestore();
  });

  it("shows watering failure with observed time on the alert card", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(new Date("2026-05-07T14:42:00.000Z").getTime());
    const mockReasonPresentation = jest.requireMock("@/services/controlService").getMotorReasonPresentation as jest.Mock;
    mockReasonPresentation.mockReturnValue({
      reasonCode: 7,
      message: "La sonde a répondu trop tard au contrôleur moteur. Réessayez.",
    });
    mockCreateMotorCommand.mockResolvedValue({
      command: {
        commandId: "cmd-failed",
        status: MotorCommandStatus.QUEUED,
      },
    });
    mockPollMotorCommandStatus.mockResolvedValue({
      command: {
        commandId: "cmd-failed",
        status: MotorCommandStatus.FAILED,
        reasonCode: 7,
      },
      isTerminal: true,
      timedOut: false,
    });

    const { findAllByText, getByText } = render(<Alerts />);

    fireEvent.press((await findAllByText("Arroser"))[0]);

    await waitFor(() => {
      expect(getByText(/La sonde a répondu trop tard au contrôleur moteur\. Réessayez\./)).toBeTruthy();
      expect(getByText(/14:42|16:42/)).toBeTruthy();
    });

    nowSpy.mockRestore();
  });

  it("restores the latest watering command summary after remount", async () => {
    mockUseAlertMotorSummaries.mockReturnValue({
      summaries: {
        "plant-dry": {
          commandId: "cmd-restored",
          status: MotorCommandStatus.SUCCEEDED,
          observedAt: new Date("2026-05-07T09:05:00.000Z").getTime(),
          message: "Arrosage terminé avec succès.",
        },
      },
      loaded: true,
      setSummary: jest.fn(),
    });

    const { getByText } = render(<Alerts />);

    await waitFor(() => {
      expect(getByText(/Arrosage terminé avec succès\./)).toBeTruthy();
      expect(getByText(/09:05|11:05/)).toBeTruthy();
    });
  });

  it("shows an empty French state when no plants are configured", () => {
    mockUseGardenStorage.mockReturnValue({ plants: [], sondes: [] });
    mockUseSensorData.mockReturnValue(new Map());

    const { getByText } = render(<Alerts />);

    expect(getByText("Aucune plante à surveiller")).toBeTruthy();
  });
});

describe("Chat page", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<Chat />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows page title", () => {
    const { getByText } = render(<Chat />);
    expect(getByText("Chat")).toBeTruthy();
  });
});

describe("Profile page", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<Profile />);
    expect(toJSON()).toBeTruthy();
  });

  it("keeps sensitive account forms collapsed until requested", () => {
    const { getByText, queryByText } = render(<Profile />);

    expect(getByText("Changer l'adresse email")).toBeTruthy();
    expect(getByText("Changer le mot de passe")).toBeTruthy();
    expect(queryByText("Nouvelle adresse email")).toBeNull();
    expect(queryByText("Nouveau mot de passe")).toBeNull();

    fireEvent.press(getByText("Changer l'adresse email"));
    expect(getByText("Nouvelle adresse email")).toBeTruthy();
  });

  it("shows useful profile shortcuts instead of inactive support rows", () => {
    const { getByText, queryByText } = render(<Profile />);

    expect(getByText("Raccourcis utiles")).toBeTruthy();
    expect(getByText("Mes hubs")).toBeTruthy();
    expect(getByText("Santé du jardin")).toBeTruthy();
    expect(getByText("Carte du jardin")).toBeTruthy();
    expect(queryByText("Confidentialité")).toBeNull();
    expect(queryByText("Support")).toBeNull();
  });
});

describe("Hubs page", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<Hubs />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows empty state when no hubs", () => {
    const { toJSON } = render(<Hubs />);
    expect(toJSON()).toBeTruthy();
  });

  it("returns to profile from the hubs header", () => {
    const { getByRole } = render(<Hubs />);

    fireEvent.press(getByRole("button"));

    expect(mockReplace).toHaveBeenCalledWith("/pages/profile");
  });
});
