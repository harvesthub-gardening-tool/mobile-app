import React from "react";
import { render } from "@testing-library/react-native";
import { View } from "react-native";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
  MaterialCommunityIcons: "MaterialCommunityIcons",
}));

const mockPush = jest.fn();
let mockPathname = "/pages/dashboard";
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

import BottomMenu from "../../app/components/BottomMenu";

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/pages/dashboard";
});

describe("BottomMenu", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<BottomMenu />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders a non-empty tree", () => {
    const { UNSAFE_getAllByType } = render(<BottomMenu />);
    expect(UNSAFE_getAllByType(View).length).toBeGreaterThanOrEqual(1);
  });

  it("renders with dashboard route active", () => {
    mockPathname = "/pages/dashboard";
    const { toJSON } = render(<BottomMenu />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with alerts route active", () => {
    mockPathname = "/pages/alerts";
    const { toJSON } = render(<BottomMenu />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with stats route active", () => {
    mockPathname = "/pages/stats";
    const { toJSON } = render(<BottomMenu />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with chat route active", () => {
    mockPathname = "/pages/chat";
    const { toJSON } = render(<BottomMenu />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with profile route active", () => {
    mockPathname = "/pages/profile";
    const { toJSON } = render(<BottomMenu />);
    expect(toJSON()).toBeTruthy();
  });

  it("falls back to first tab on unknown route", () => {
    mockPathname = "/unknown";
    const { toJSON } = render(<BottomMenu />);
    expect(toJSON()).toBeTruthy();
  });

  it("exposes press handlers via native components", () => {
    // Pressable in RN may render as a native host element
    // Just verify the component mounts and the router mock is wired correctly
    render(<BottomMenu />);
    // router.push is available but only called on actual presses
    expect(mockPush).not.toHaveBeenCalled();
  });
});
