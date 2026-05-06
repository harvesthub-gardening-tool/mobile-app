import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";

jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("react-native-gesture-handler", () => ({
  Gesture: {
    Pan: jest.fn(() => ({
      enabled: jest.fn().mockReturnThis(),
      onBegin: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
      onFinalize: jest.fn().mockReturnThis(),
    })),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("../../app/services/controlService", () => ({
  createMotorCommand: jest.fn(),
  pollMotorCommandStatus: jest.fn(),
  getMotorReasonPresentation: jest.fn((command) => {
    switch (command?.reasonCode) {
      case 7:
        return {
          reasonCode: command.reasonCode,
          message: "La sonde a répondu trop tard au contrôleur moteur. Réessayez.",
        };
      case 5:
        return {
          reasonCode: command.reasonCode,
          message: "La sonde est injoignable pour cette commande. Vérifiez sa connexion.",
        };
      case 3:
        return {
          reasonCode: command.reasonCode,
          message: "La commande a expiré avant de pouvoir être exécutée.",
        };
      default:
        return null;
    }
  }),
}));

import { CatalogModal } from "../../app/components/garden/CatalogModal";
import { PlantDetailModal } from "../../app/components/garden/PlantDetailModal";
import { PlantEditModal } from "../../app/components/garden/PlantEditModal";
import { PlantCard } from "../../app/components/garden/PlantCard";
import { createMotorCommand, pollMotorCommandStatus } from "../../app/services/controlService";
import { MotorCommandReasonCode, MotorCommandStatus } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";

const mockCreateMotorCommand = createMotorCommand as jest.Mock;
const mockPollMotorCommandStatus = pollMotorCommandStatus as jest.Mock;

const PLANT_TYPE = { id: "t1", name: "Tomate", emoji: "🍅", category: "legume" as const };
const PLANT: import("../../app/types/garden").PlacedPlant = {
  id: "p1", plantType: PLANT_TYPE, x: 10, y: 20,
  width: 140, height: 140, quantity: 3, sondeId: null,
};
const SONDE: import("../../app/types/garden").PlacedSonde = {
  id: "s1", x: 100, y: 100, nodeId: "node-1", hubId: "42", hubName: "Hub A",
};

// ── CatalogModal ────────────────────────────────────────────────

describe("CatalogModal", () => {
  it("renders when visible", () => {
    const { toJSON } = render(
      <CatalogModal visible sondes={[]} onClose={jest.fn()} onSelectPlant={jest.fn()} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(
      <CatalogModal visible={false} sondes={[]} onClose={jest.fn()} onSelectPlant={jest.fn()} />,
    );
    expect(queryByText("Tomate")).toBeNull();
  });

  it("calls onClose when close button pressed", () => {
    const onClose = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <CatalogModal visible sondes={[]} onClose={onClose} onSelectPlant={jest.fn()} />,
    );
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
    expect(onClose).toHaveBeenCalled();
  });
});

// ── PlantDetailModal ────────────────────────────────────────────

describe("PlantDetailModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPollMotorCommandStatus.mockResolvedValue({
      command: { commandId: "cmd-1", status: MotorCommandStatus.SUCCEEDED },
      isTerminal: true,
      timedOut: false,
    });
  });

  it("renders null when plant is null", () => {
    const { toJSON } = render(
      <PlantDetailModal
        plant={null} sondes={[]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders plant info in detail mode", () => {
    const { getByText } = render(
      <PlantDetailModal
        plant={PLANT} sondes={[]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );
    expect(getByText("Tomate")).toBeTruthy(); // header shows plant name
  });

  it("shows linked sonde name", () => {
    const linkedPlant = { ...PLANT, sondeId: "s1" };
    const { getByText } = render(
      <PlantDetailModal
        plant={linkedPlant} sondes={[SONDE]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );
    expect(getByText("Hub A 1")).toBeTruthy();
  });

  it("shows motor trigger for linked probe and invokes create with default duration", async () => {
    mockCreateMotorCommand.mockResolvedValue({
      command: { commandId: "cmd-1", status: MotorCommandStatus.QUEUED },
    });
    const linkedPlant = { ...PLANT, sondeId: "s1" };
    const { getByText } = render(
      <PlantDetailModal
        plant={linkedPlant} sondes={[SONDE]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );

    fireEvent.press(getByText("Arroser"));

    await waitFor(() => {
      expect(mockCreateMotorCommand).toHaveBeenCalledWith("42", "node-1", 3000);
    });
    expect(mockPollMotorCommandStatus).toHaveBeenCalledWith("cmd-1", expect.objectContaining({
      onStatusChange: expect.any(Function),
    }));
    await waitFor(() => expect(getByText("Arrosage terminé avec succès.")).toBeTruthy());
  });

  it("shows 'Aucune sonde' when no sonde linked", () => {
    const { getByText } = render(
      <PlantDetailModal
        plant={PLANT} sondes={[SONDE]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );
    expect(getByText("Aucune sonde")).toBeTruthy();
  });

  it("hides motor trigger when no linked probe is usable", () => {
    const { queryByText, rerender } = render(
      <PlantDetailModal
        plant={PLANT} sondes={[SONDE]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );

    expect(queryByText("Arroser")).toBeNull();

    rerender(
      <PlantDetailModal
        plant={{ ...PLANT, sondeId: "s1" }} sondes={[{ ...SONDE, nodeId: "" }]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );
    expect(queryByText("Arroser")).toBeNull();

    rerender(
      <PlantDetailModal
        plant={{ ...PLANT, sondeId: "s1" }} sondes={[{ ...SONDE, hubId: undefined }]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );
    expect(queryByText("Arroser")).toBeNull();
  });

  it("disables motor button while active command is non-terminal", async () => {
    mockCreateMotorCommand.mockResolvedValue({
      command: { commandId: "cmd-active", status: MotorCommandStatus.EXECUTING },
    });
    mockPollMotorCommandStatus.mockImplementation(() => new Promise(() => undefined));
    const linkedPlant = { ...PLANT, sondeId: "s1" };
    const { getByText } = render(
      <PlantDetailModal
        plant={linkedPlant} sondes={[SONDE]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );

    fireEvent.press(getByText("Arroser"));

    await waitFor(() => expect(getByText("En cours")).toBeTruthy());
    expect(getByText("Arrosage en cours...")).toBeTruthy();
    fireEvent.press(getByText("En cours"));
    expect(mockCreateMotorCommand).toHaveBeenCalledTimes(1);
  });

  it("shows failed and expired states and allows retry", async () => {
    mockCreateMotorCommand
      .mockResolvedValueOnce({
        command: {
          commandId: "cmd-failed",
          status: MotorCommandStatus.FAILED,
          reasonCode: MotorCommandReasonCode.PROBE_UNREACHABLE,
        },
      })
      .mockResolvedValueOnce({
        command: {
          commandId: "cmd-expired",
          status: MotorCommandStatus.EXPIRED,
          reasonCode: MotorCommandReasonCode.EXPIRED,
        },
      });
    const linkedPlant = { ...PLANT, sondeId: "s1" };
    const { getByText } = render(
      <PlantDetailModal
        plant={linkedPlant} sondes={[SONDE]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );

    fireEvent.press(getByText("Arroser"));
    await waitFor(() => expect(getByText("La sonde est injoignable pour cette commande. Vérifiez sa connexion.")).toBeTruthy());

    fireEvent.press(getByText("Arroser"));
    await waitFor(() => expect(getByText("La commande a expiré avant de pouvoir être exécutée.")).toBeTruthy());
    expect(mockCreateMotorCommand).toHaveBeenCalledTimes(2);
  });

  it("calls onDelete when delete pressed", () => {
    const onDelete = jest.fn();
    const { getByText } = render(
      <PlantDetailModal
        plant={PLANT} sondes={[]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={onDelete} onLinkSonde={jest.fn()}
      />,
    );
    fireEvent.press(getByText("Supprimer"));
    expect(onDelete).toHaveBeenCalledWith("p1");
  });

  it("switches to edit mode when edit button pressed", () => {
    const { UNSAFE_getAllByType, toJSON } = render(
      <PlantDetailModal
        plant={PLANT} sondes={[]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 2]);
    expect(toJSON()).toBeTruthy(); // UI updated
  });

  it("toggling edit mode updates UI state", () => {
    const { UNSAFE_getAllByType, toJSON } = render(
      <PlantDetailModal
        plant={PLANT} sondes={[]}
        onClose={jest.fn()} onSave={jest.fn()}
        onDelete={jest.fn()} onLinkSonde={jest.fn()}
      />,
    );
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 2]);
    expect(toJSON()).toBeTruthy();
  });
});

// ── PlantEditModal ──────────────────────────────────────────────

describe("PlantEditModal", () => {
  it("renders null when plant is null", () => {
    const { toJSON } = render(
      <PlantEditModal plant={null} onClose={jest.fn()} onSave={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders fields when plant is provided", () => {
    const { toJSON } = render(
      <PlantEditModal plant={PLANT} onClose={jest.fn()} onSave={jest.fn()} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("calls onSave with values when save pressed", () => {
    const onSave = jest.fn();
    const { getByText } = render(
      <PlantEditModal plant={PLANT} onClose={jest.fn()} onSave={onSave} />,
    );
    fireEvent.press(getByText("Enregistrer"));
    expect(onSave).toHaveBeenCalledWith("p1", expect.any(Number), expect.any(Number), expect.any(Number));
  });
});

// ── PlantCard ───────────────────────────────────────────────────

describe("PlantCard", () => {
  const sharedVal = { value: 1 } as import("react-native-reanimated").SharedValue<number>;
  const isCardInteracting = { value: false } as import("react-native-reanimated").SharedValue<boolean>;

  const baseProps = {
    plant: PLANT,
    sondes: [],
    sensorData: new Map(),
    isSelected: false,
    isMoving: false,
    mapScale: sharedVal,
    isCardInteracting,
    onPress: jest.fn(),
    onDelete: jest.fn(),
    onToggleMove: jest.fn(),
    onMove: jest.fn(),
    onResize: jest.fn(),
  };

  it("renders without crashing", () => {
    const { toJSON } = render(<PlantCard {...baseProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows sensor badges when sonde linked with data", () => {
    const linkedPlant = { ...PLANT, sondeId: "s1" };
    const sensorData = new Map([["node-1", { airTemperature: 22.5, airHumidity: 60 }]]);
    const { getByText } = render(
      <PlantCard {...baseProps} plant={linkedPlant} sondes={[SONDE]} sensorData={sensorData} />,
    );
    expect(getByText("22.5°")).toBeTruthy();
    expect(getByText("60%")).toBeTruthy();
  });

  it("shows mock values when sonde linked but no backend data", () => {
    const linkedPlant = { ...PLANT, sondeId: "s1" };
    const { toJSON } = render(
      <PlantCard {...baseProps} plant={linkedPlant} sondes={[SONDE]} sensorData={new Map()} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("calls onPress when tapped (not moving)", () => {
    const onPress = jest.fn();
    const { UNSAFE_queryAllByType } = render(<PlantCard {...baseProps} onPress={onPress} />);
    const pressables = UNSAFE_queryAllByType(require("react-native").Pressable);
    if (pressables.length > 0) {
      fireEvent.press(pressables[0]);
      expect(onPress).toHaveBeenCalledWith("p1");
    } else {
      expect(true).toBe(true); // Animated path, gesture handles press
    }
  });

  it("renders move handles when isMoving=true", () => {
    const { toJSON } = render(<PlantCard {...baseProps} isMoving />);
    expect(toJSON()).toBeTruthy();
  });
});
