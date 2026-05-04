import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";

jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
}));

jest.mock("../../app/services/authService", () => ({
  listHubs: jest.fn(),
}));

jest.mock("../../app/services/gardenService", () => ({
  listProbesForHubName: jest.fn(),
}));

import { SondeListModal } from "../../app/components/garden/SondeListModal";
import { listHubs } from "../../app/services/authService";
import { listProbesForHubName } from "../../app/services/gardenService";

const mockListHubs = listHubs as jest.Mock;
const mockListProbesForHubName = listProbesForHubName as jest.Mock;

const basePlant = {
  id: "p1",
  plantType: { id: "t1", name: "Tomate", emoji: "🍅", category: "legume" as const },
  x: 10,
  y: 10,
  width: 120,
  height: 120,
  quantity: 1,
  sondeId: null,
};

const baseSonde = {
  id: "s1",
  x: 0,
  y: 0,
  nodeId: "node-1",
  hubName: "Hub A",
};

describe("SondeListModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListHubs.mockResolvedValue([{ hubName: "Hub A" }, { hubName: "Hub B" }]);
    mockListProbesForHubName.mockResolvedValue([
      { nodeId: "node-1", airTemperature: 22.2, airHumidity: 50 },
      { nodeId: "node-2", airTemperature: 21, airHumidity: 60 },
      { nodeId: "node-2", airTemperature: 20, airHumidity: 62 },
    ]);
  });

  it("does not load hubs when hidden", () => {
    render(
      <SondeListModal
        visible={false}
        plants={[]}
        sondes={[]}
        onClose={jest.fn()}
        onSelectProbe={jest.fn()}
      />,
    );
    expect(mockListHubs).not.toHaveBeenCalled();
  });

  it("loads hubs and probes, then selects an available probe", async () => {
    const onSelectProbe = jest.fn();
    const { getByText, getAllByText } = render(
      <SondeListModal
        visible
        plants={[]}
        sondes={[]}
        onClose={jest.fn()}
        onSelectProbe={onSelectProbe}
      />,
    );

    await waitFor(() => expect(mockListHubs).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockListProbesForHubName).toHaveBeenCalledWith("Hub A"));

    expect(getByText("Hub A")).toBeTruthy();
    expect(getByText("Hub B")).toBeTruthy();

    fireEvent.press(getAllByText("Ajouter")[0]);
    expect(onSelectProbe).toHaveBeenCalledWith({
      nodeId: "node-1",
      hubName: "Hub A",
    });
  });

  it("marks already linked probes as already added", async () => {
    const linkedPlant = { ...basePlant, sondeId: "s1" };
    const { getByText, getAllByText } = render(
      <SondeListModal
        visible
        plants={[linkedPlant]}
        sondes={[baseSonde]}
        onClose={jest.fn()}
        onSelectProbe={jest.fn()}
      />,
    );

    await waitFor(() => expect(mockListProbesForHubName).toHaveBeenCalled());
    expect(getByText("Déjà ajoutée")).toBeTruthy();
    expect(getAllByText("Ajouter").length).toBeGreaterThanOrEqual(1);
  });

  it("shows error if loading hubs fails", async () => {
    mockListHubs.mockRejectedValue(new Error("Hubs indisponibles"));
    const { getByText } = render(
      <SondeListModal
        visible
        plants={[]}
        sondes={[]}
        onClose={jest.fn()}
        onSelectProbe={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText("Hubs indisponibles")).toBeTruthy());
  });

  it("shows error if loading probes fails", async () => {
    mockListProbesForHubName.mockRejectedValue(new Error("Sondes indisponibles"));
    const { getByText } = render(
      <SondeListModal
        visible
        plants={[]}
        sondes={[]}
        onClose={jest.fn()}
        onSelectProbe={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText("Sondes indisponibles")).toBeTruthy());
  });

  it("supports close, refresh and hub switching", async () => {
    const onClose = jest.fn();
    const { UNSAFE_getAllByType, getByText } = render(
      <SondeListModal
        visible
        plants={[]}
        sondes={[]}
        onClose={onClose}
        onSelectProbe={jest.fn()}
      />,
    );

    await waitFor(() => expect(mockListProbesForHubName).toHaveBeenCalledWith("Hub A"));

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[0]);
    expect(onClose).toHaveBeenCalled();

    fireEvent.press(buttons[1]);
    await waitFor(() => expect(mockListProbesForHubName.mock.calls.length).toBeGreaterThanOrEqual(2));

    fireEvent.press(getByText("Hub B"));
    await waitFor(() => expect(mockListProbesForHubName).toHaveBeenCalledWith("Hub B"));
  });
});
