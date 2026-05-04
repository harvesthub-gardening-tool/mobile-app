import React from "react";
import { render } from "@testing-library/react-native";

jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
}));
jest.mock("../../app/context/AuthContext", () => ({
  useAuth: () => ({ logout: jest.fn(), userId: "u1", token: "tok", isAuthenticated: true }),
}));
jest.mock("../../app/hooks/useHubs", () => ({
  useHubs: () => ({ hubs: [], loading: false, error: null, refresh: jest.fn() }),
}));
jest.mock("../../app/services/authService", () => ({
  listHubs: jest.fn().mockResolvedValue([]),
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
});
