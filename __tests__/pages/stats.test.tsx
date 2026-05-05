import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../../app/hooks/useGardenStorage", () => ({
  useGardenStorage: jest.fn(),
}));

jest.mock("../../app/hooks/useSensorData", () => ({
  useSensorData: jest.fn(),
}));

jest.mock("../../app/hooks/useHubs", () => ({
  useHubs: jest.fn(),
}));

jest.mock("../../app/services/gardenService", () => ({
  getSummary: jest.fn(),
}));

import Stats from "../../app/pages/stats";
import { useGardenStorage } from "../../app/hooks/useGardenStorage";
import { useSensorData } from "../../app/hooks/useSensorData";
import { useHubs } from "../../app/hooks/useHubs";
import { getSummary } from "../../app/services/gardenService";

const mockUseGardenStorage = useGardenStorage as jest.Mock;
const mockUseSensorData = useSensorData as jest.Mock;
const mockUseHubs = useHubs as jest.Mock;
const mockGetSummary = getSummary as jest.Mock;

describe("Stats page", () => {
  let refreshMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    refreshMock = jest.fn().mockResolvedValue(undefined);

    mockUseGardenStorage.mockReturnValue({
      plants: [
        {
          id: "plant-1",
          plantType: { id: "tomato", name: "Tomate", emoji: "🍅", category: "fruit" },
          x: 0,
          y: 0,
          width: 60,
          height: 60,
          quantity: 4,
          sondeId: "sonde-1",
        },
        {
          id: "plant-2",
          plantType: { id: "basil", name: "Basilic", emoji: "🌿", category: "herbe" },
          x: 20,
          y: 20,
          width: 60,
          height: 60,
          quantity: 2,
          sondeId: null,
        },
      ],
      sondes: [
        { id: "sonde-1", x: 0, y: 0, nodeId: "node-1", hubName: "Hub A" },
        { id: "sonde-2", x: 0, y: 0, nodeId: "node-2", hubName: "Hub A" },
      ],
    });

    mockUseSensorData.mockReturnValue(
      new Map([
        [
          "node-1",
          {
            airTemperature: 22.4,
            airHumidity: 58,
            soilHumidity: 44,
            soilTemperature: 19.1,
          },
        ],
        [
          "node-2",
          {
            airTemperature: 24,
            airHumidity: 62,
            soilHumidity: 51,
            soilTemperature: 20.5,
          },
        ],
      ]),
    );

    mockUseHubs.mockReturnValue({
      hubs: [
        {
          id: "hub-1",
          hubName: "Hub A",
          createdAt: BigInt(1_700_000_000_000),
          claimed: true,
          revoked: false,
          deviceId: "dev-1",
        },
      ],
      loading: false,
      error: null,
      refresh: refreshMock,
    });

    mockGetSummary.mockResolvedValue([
      {
        nodeId: "node-1",
        hubId: "hub-1",
        intervalStart: BigInt(1_700_000_000_000),
        avgAirTemperature: 21.5,
        avgAirHumidity: 54,
        avgSoilHumidity: 42,
        avgSoilTemperature: 18.8,
        maxAirTemperature: 25.1,
      },
      {
        nodeId: "node-2",
        hubId: "hub-1",
        intervalStart: BigInt(1_700_000_900_000),
        avgAirTemperature: 23.2,
        avgAirHumidity: 56,
        avgSoilHumidity: 49,
        avgSoilTemperature: 19.4,
        maxAirTemperature: 27.3,
      },
    ]);
  });

  it("renders the new dashboard sections", async () => {
    const { getByText } = render(<Stats />);

    expect(getByText("Statistiques utiles")).toBeTruthy();
    expect(getByText("Les indicateurs qui comptent aujourd'hui")).toBeTruthy();
    expect(getByText("Lecture instantanée de l'environnement")).toBeTruthy();
    expect(getByText("Répartition de l'humidité du sol")).toBeTruthy();

    await waitFor(() => {
      expect(getByText("Évolution agrégée sur les dernières heures")).toBeTruthy();
    });
  });

  it("shows useful KPI labels", async () => {
    const { getByText } = render(<Stats />);

    expect(getByText("Plantes")).toBeTruthy();
    expect(getByText("Sondes actives")).toBeTruthy();
    expect(getByText("Couverture")).toBeTruthy();
    expect(getByText("Hubs")).toBeTruthy();

    await waitFor(() => {
      expect(getByText("Capacité terrain par hub")).toBeTruthy();
    });
  });

  it("renders trend chart containers", async () => {
    const { getByTestId } = render(<Stats />);

    await waitFor(() => {
      expect(getByTestId("air-trend-card")).toBeTruthy();
      expect(getByTestId("soil-trend-card")).toBeTruthy();
    });
  });

  it("loads summary data for the selected time window", async () => {
    render(<Stats />);

    await waitFor(() => {
      expect(mockGetSummary).toHaveBeenCalledWith(undefined, 24, "hub-1");
    });
  });

  it("changes the summary window when selecting another range", async () => {
    const { getByText } = render(<Stats />);

    await waitFor(() => {
      expect(mockGetSummary).toHaveBeenCalledWith(undefined, 24, "hub-1");
    });

    fireEvent.press(getByText("48h"));

    await waitFor(() => {
      expect(mockGetSummary).toHaveBeenCalledWith(undefined, 48, "hub-1");
    });
  });

  it("keeps fulfilled trend data when one hub request fails", async () => {
    mockUseHubs.mockReturnValue({
      hubs: [
        {
          id: "hub-1",
          hubName: "Hub A",
          createdAt: BigInt(1_700_000_000_000),
          claimed: true,
          revoked: false,
          deviceId: "dev-1",
        },
        {
          id: "hub-2",
          hubName: "Hub B",
          createdAt: BigInt(1_700_000_100_000),
          claimed: true,
          revoked: false,
          deviceId: "dev-2",
        },
      ],
      loading: false,
      error: null,
      refresh: refreshMock,
    });

    mockGetSummary.mockImplementation((_nodeId, hours, hubId) => {
      if (hours === 24 && hubId === "hub-2") {
        return Promise.reject(new Error("Hub B down"));
      }

      return Promise.resolve([
        {
          nodeId: "node-1",
          hubId,
          intervalStart: BigInt(1_700_000_000_000),
          avgAirTemperature: 20,
          avgAirHumidity: 54,
          avgSoilHumidity: 40,
          avgSoilTemperature: 18,
          maxAirTemperature: 25,
        },
      ]);
    });

    const { getByText, getByTestId } = render(<Stats />);

    await waitFor(() => {
      expect(getByText("Certaines tendances de hub sont momentanément indisponibles.")).toBeTruthy();
      expect(getByText("Pic chaleur")).toBeTruthy();
      expect(getByTestId("soil-trend-card")).toBeTruthy();
    });
  });

  it("pull-to-refresh calls hub refresh", async () => {
    const screen = render(<Stats />);
    const refreshControl = (screen as unknown as {
      UNSAFE_getByType: (component: unknown) => unknown;
    }).UNSAFE_getByType(require("react-native").RefreshControl);

    await act(async () => {
      fireEvent(refreshControl, "refresh");
    });

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

  it("does not count invalid sonde ids as covered plants", async () => {
    mockUseGardenStorage.mockReturnValue({
      plants: [
        {
          id: "plant-1",
          plantType: { id: "tomato", name: "Tomate", emoji: "🍅", category: "fruit" },
          x: 0,
          y: 0,
          width: 60,
          height: 60,
          quantity: 4,
          sondeId: "missing-sonde",
        },
      ],
      sondes: [],
    });
    mockUseSensorData.mockReturnValue(new Map());

    const { getByText } = render(<Stats />);

    await waitFor(() => {
      expect(getByText("0/1 plante suivie")).toBeTruthy();
    });
  });

  it("shows a hub empty state when no active hubs are available", async () => {
    mockUseGardenStorage.mockReturnValue({
      plants: [
        {
          id: "plant-1",
          plantType: { id: "tomato", name: "Tomate", emoji: "🍅", category: "fruit" },
          x: 0,
          y: 0,
          width: 60,
          height: 60,
          quantity: 1,
          sondeId: null,
        },
      ],
      sondes: [],
    });
    mockUseHubs.mockReturnValue({
      hubs: [],
      loading: false,
      error: null,
      refresh: refreshMock,
    });
    mockGetSummary.mockResolvedValue([]);

    const { getByText } = render(<Stats />);

    await waitFor(() => {
      expect(getByText("Aucun hub actif à afficher pour l'instant. Associez ou activez un hub pour comparer vos zones.")).toBeTruthy();
    });
  });

  it("shows onboarding empty state when no data is available", async () => {
    mockUseGardenStorage.mockReturnValue({ plants: [], sondes: [] });
    mockUseSensorData.mockReturnValue(new Map());
    mockUseHubs.mockReturnValue({
      hubs: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });
    mockGetSummary.mockResolvedValue([]);

    const { getByText } = render(<Stats />);

    await waitFor(() => {
      expect(getByText("Le tableau de bord attend ses premières données")).toBeTruthy();
    });
  });
});
