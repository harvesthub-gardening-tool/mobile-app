import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Text, TouchableOpacity, View } from "react-native";

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
}));

jest.mock("react-native-reanimated", () => {
  const ReactActual = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: {
      View: ({ children, ...props }: { children: React.ReactNode }) => (
        <RN.View {...props}>{children}</RN.View>
      ),
    },
  };
});

jest.mock("react-native-gesture-handler", () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseGardenStorage = jest.fn();
const mockUseSensorData = jest.fn();
const mockUseMapGestures = jest.fn();

jest.mock("../../app/hooks/useGardenStorage", () => ({
  useGardenStorage: () => mockUseGardenStorage(),
}));

jest.mock("../../app/hooks/useSensorData", () => ({
  useSensorData: () => mockUseSensorData(),
}));

jest.mock("../../app/hooks/useMapGestures", () => ({
  useMapGestures: (onTap?: () => void) => mockUseMapGestures(onTap),
}));

jest.mock("../../app/components/garden", () => {
  const ReactActual = require("react");
  const RN = require("react-native");
  const { PLANT_CATALOG } = require("../../app/constants/garden");

  return {
    GrassLayer: () => <RN.Text>grass</RN.Text>,
    PlantCard: ({
      plant,
      onPress,
      onMove,
      onResize,
      isMoving,
    }: {
      plant: { id: string };
      onPress: (id: string) => void;
      onMove: (id: string, x: number, y: number) => void;
      onResize: (id: string, x: number, y: number, w: number, h: number) => void;
      isMoving: boolean;
    }) => (
      <RN.View>
        <RN.TouchableOpacity onPress={() => onPress(plant.id)}>
          <RN.Text>{`plant-${plant.id}`}</RN.Text>
        </RN.TouchableOpacity>
        <RN.TouchableOpacity onPress={() => onMove(plant.id, -100, 99999)}>
          <RN.Text>{`move-${plant.id}`}</RN.Text>
        </RN.TouchableOpacity>
        <RN.TouchableOpacity onPress={() => onResize(plant.id, -50, 99999, 10, 20)}>
          <RN.Text>{`resize-${plant.id}`}</RN.Text>
        </RN.TouchableOpacity>
        {isMoving ? <RN.Text>{`moving-${plant.id}`}</RN.Text> : null}
      </RN.View>
    ),
    ZoomControls: ({
      onZoomIn,
      onZoomOut,
      onRecenter,
    }: {
      onZoomIn: () => void;
      onZoomOut: () => void;
      onRecenter: () => void;
    }) => (
      <RN.View>
        <RN.TouchableOpacity onPress={onZoomIn}>
          <RN.Text>zoom-in</RN.Text>
        </RN.TouchableOpacity>
        <RN.TouchableOpacity onPress={onZoomOut}>
          <RN.Text>zoom-out</RN.Text>
        </RN.TouchableOpacity>
        <RN.TouchableOpacity onPress={onRecenter}>
          <RN.Text>recenter</RN.Text>
        </RN.TouchableOpacity>
      </RN.View>
    ),
    AddMenu: ({ onPress }: { onPress: () => void }) => (
      <RN.TouchableOpacity onPress={onPress}>
        <RN.Text>open-sondes</RN.Text>
      </RN.TouchableOpacity>
    ),
    CatalogModal: ({
      onSelectPlant,
    }: {
      visible: boolean;
      onClose: () => void;
      onSelectPlant: (plant: unknown) => void;
    }) => (
      <RN.TouchableOpacity onPress={() => onSelectPlant(PLANT_CATALOG[0])}>
        <RN.Text>catalog-select</RN.Text>
      </RN.TouchableOpacity>
    ),
    PlantDetailModal: ({
      plant,
      onClose,
      onSave,
      onDelete,
      onLinkSonde,
    }: {
      plant: { id: string; plantType: unknown; width: number; height: number } | null;
      onClose: () => void;
      onSave: (id: string, plantType: unknown, width: number, height: number, quantity: number) => void;
      onDelete: (id: string) => void;
      onLinkSonde: (plantId: string, sondeId: string | null) => void;
    }) =>
      plant ? (
        <RN.View>
          <RN.Text>{`detail-${plant.id}`}</RN.Text>
          <RN.TouchableOpacity
            onPress={() => onSave(plant.id, plant.plantType, plant.width + 1, plant.height + 2, 3)}
          >
            <RN.Text>detail-save</RN.Text>
          </RN.TouchableOpacity>
          <RN.TouchableOpacity onPress={() => onLinkSonde(plant.id, "s-linked")}>
            <RN.Text>detail-link</RN.Text>
          </RN.TouchableOpacity>
          <RN.TouchableOpacity onPress={() => onDelete(plant.id)}>
            <RN.Text>detail-delete</RN.Text>
          </RN.TouchableOpacity>
          <RN.TouchableOpacity onPress={onClose}>
            <RN.Text>detail-close</RN.Text>
          </RN.TouchableOpacity>
        </RN.View>
      ) : null,
    SondeListModal: ({
      visible,
      onClose,
      onSelectProbe,
    }: {
      visible: boolean;
      onClose: () => void;
      onSelectProbe: (probe: { nodeId: string; hubName: string }) => void;
    }) =>
      visible ? (
        <RN.View>
          <RN.Text>sonde-modal</RN.Text>
          <RN.TouchableOpacity
            onPress={() => onSelectProbe({ nodeId: "node-2", hubName: "Hub B" })}
          >
            <RN.Text>sonde-select</RN.Text>
          </RN.TouchableOpacity>
          <RN.TouchableOpacity onPress={onClose}>
            <RN.Text>sonde-close</RN.Text>
          </RN.TouchableOpacity>
        </RN.View>
      ) : null,
  };
});

import Dashboard from "../../app/pages/dashboard";
import { MAP_SIZE, MIN_CARD_SIZE } from "../../app/constants/garden";

const basePlant = {
  id: "p1",
  plantType: { id: "t1", name: "Tomate", emoji: "🍅", category: "legume" as const },
  x: 100,
  y: 100,
  width: 140,
  height: 140,
  quantity: 2,
  sondeId: null,
};

describe("Dashboard page", () => {
  let capturedTap: (() => void) | undefined;

  const updatePlant = jest.fn();
  const addPlant = jest.fn();
  const addPlantForSonde = jest.fn();
  const removePlant = jest.fn();
  const addSonde = jest.fn();
  const linkPlantToSonde = jest.fn();
  const recenter = jest.fn();
  const zoomIn = jest.fn();
  const zoomOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    capturedTap = undefined;

    mockUseGardenStorage.mockReturnValue({
      plants: [],
      sondes: [],
      addPlant,
      addPlantForSonde,
      removePlant,
      updatePlant,
      addSonde,
      linkPlantToSonde,
    });

    mockUseSensorData.mockReturnValue(new Map());

    mockUseMapGestures.mockImplementation((onTap?: () => void) => {
      capturedTap = onTap;
      return {
        composedGesture: {},
        animatedStyle: {},
        scale: { value: 1 },
        translateX: { value: 0 },
        translateY: { value: 0 },
        isCardInteracting: { value: false },
        zoomIn,
        zoomOut,
        recenter,
      };
    });
  });

  it("renders empty state when there are no plants", () => {
    const { getByText } = render(<Dashboard />);
    expect(getByText("Votre jardin est vide")).toBeTruthy();
  });

  it("handles plant movement, resize and zoom controls", () => {
    mockUseGardenStorage.mockReturnValue({
      plants: [basePlant],
      sondes: [],
      addPlant,
      addPlantForSonde,
      removePlant,
      updatePlant,
      addSonde,
      linkPlantToSonde,
    });

    const { getByText } = render(<Dashboard />);
    fireEvent.press(getByText("move-p1"));
    fireEvent.press(getByText("resize-p1"));
    fireEvent.press(getByText("zoom-in"));
    fireEvent.press(getByText("zoom-out"));
    fireEvent.press(getByText("recenter"));

    expect(updatePlant).toHaveBeenCalledWith("p1", {
      x: 0,
      y: MAP_SIZE - 60,
    });
    expect(updatePlant).toHaveBeenCalledWith("p1", {
      x: 0,
      y: MAP_SIZE - MIN_CARD_SIZE,
      width: MIN_CARD_SIZE,
      height: MIN_CARD_SIZE,
    });
    expect(zoomIn).toHaveBeenCalled();
    expect(zoomOut).toHaveBeenCalled();
    expect(recenter).toHaveBeenCalled();
  });

  it("handles selection and map tap reset callback", () => {
    mockUseGardenStorage.mockReturnValue({
      plants: [basePlant],
      sondes: [],
      addPlant,
      addPlantForSonde,
      removePlant,
      updatePlant,
      addSonde,
      linkPlantToSonde,
    });

    const { queryByText, UNSAFE_getAllByType } = render(<Dashboard />);

    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);

    act(() => {
      capturedTap?.();
    });
    expect(queryByText("detail-p1")).toBeNull();
  });

  it("creates a plant from selected probe with viewport coordinates", () => {
    mockUseGardenStorage.mockReturnValue({
      plants: [basePlant],
      sondes: [],
      addPlant,
      addPlantForSonde: jest.fn().mockReturnValue({ ...basePlant, id: "p2" }),
      removePlant,
      updatePlant,
      addSonde: jest.fn().mockReturnValue({ id: "s2", nodeId: "node-2", hubName: "Hub B" }),
      linkPlantToSonde,
    });

    mockUseMapGestures.mockImplementation((onTap?: () => void) => {
      capturedTap = onTap;
      return {
        composedGesture: {},
        animatedStyle: {},
        scale: { value: 2 },
        translateX: { value: -100 },
        translateY: { value: -50 },
        isCardInteracting: { value: false },
        zoomIn,
        zoomOut,
        recenter,
      };
    });

    const { getByText, UNSAFE_getByProps } = render(<Dashboard />);

    const measureView = UNSAFE_getByProps({ pointerEvents: "none" });
    fireEvent(measureView, "layout", {
      nativeEvent: { layout: { width: 300, height: 200 } },
    });

    fireEvent.press(getByText("open-sondes"));
    fireEvent.press(getByText("sonde-select"));

    const calledWith = mockUseGardenStorage.mock.results[0].value.addPlantForSonde.mock.calls[0];
    expect(calledWith[1]).toBe("s2");
    expect(calledWith[2]).toEqual(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      }),
    );
  });

  it("stops probe flow when addSonde returns null", () => {
    const localAddPlantForSonde = jest.fn();
    mockUseGardenStorage.mockReturnValue({
      plants: [basePlant],
      sondes: [],
      addPlant,
      addPlantForSonde: localAddPlantForSonde,
      removePlant,
      updatePlant,
      addSonde: jest.fn().mockReturnValue(null),
      linkPlantToSonde,
    });

    const { getByText } = render(<Dashboard />);
    fireEvent.press(getByText("open-sondes"));
    fireEvent.press(getByText("sonde-select"));

    expect(localAddPlantForSonde).not.toHaveBeenCalled();
  });

  it("handles catalog selection callback", () => {
    const { getByText } = render(<Dashboard />);
    fireEvent.press(getByText("catalog-select"));
    expect(addPlant).toHaveBeenCalled();
  });
});
