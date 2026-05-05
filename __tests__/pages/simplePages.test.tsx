import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

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
  it("renders without crashing", () => {
    const { toJSON } = render(<Alerts />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows page title", () => {
    const { getByText } = render(<Alerts />);
    expect(getByText("Alert")).toBeTruthy();
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
