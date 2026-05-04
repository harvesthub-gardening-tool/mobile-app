import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import { ZoomControls } from "../../app/components/garden/ZoomControls";

jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
}));

describe("ZoomControls", () => {
  const onZoomIn = jest.fn();
  const onZoomOut = jest.fn();
  const onRecenter = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(
      <ZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} onRecenter={onRecenter} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("calls onZoomIn when plus button pressed", () => {
    const { UNSAFE_getAllByType } = render(
      <ZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} onRecenter={onRecenter} />,
    );
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  it("calls onZoomOut when minus button pressed", () => {
    const { UNSAFE_getAllByType } = render(
      <ZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} onRecenter={onRecenter} />,
    );
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[1]);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("calls onRecenter when crosshair button pressed", () => {
    const { UNSAFE_getAllByType } = render(
      <ZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} onRecenter={onRecenter} />,
    );
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[2]);
    expect(onRecenter).toHaveBeenCalledTimes(1);
  });
});
