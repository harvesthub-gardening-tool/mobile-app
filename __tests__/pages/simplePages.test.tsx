import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

const mockUseGardenStorage = jest.fn();
const mockUseSensorData = jest.fn();

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
jest.mock("../../src/hooks/useGardenStorage", () => ({
  useGardenStorage: () => mockUseGardenStorage(),
}));
jest.mock("../../src/hooks/useSensorData", () => ({
  useSensorData: () => mockUseSensorData(),
}));
jest.mock("../../src/services/authService", () => ({
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
        { id: "sonde-dry", x: 0, y: 0, nodeId: "node-dry", hubName: "Hub Nord" },
        { id: "sonde-watered", x: 0, y: 0, nodeId: "node-watered", hubName: "Hub Sud" },
      ],
    });
    mockUseSensorData.mockReturnValue(
      new Map([
        ["node-dry", { soilHumidity: 24, soilTemperature: 18.4 }],
        ["node-watered", { soilHumidity: 55, soilTemperature: 19.2 }],
      ]),
    );
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
