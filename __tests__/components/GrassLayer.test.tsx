import React from "react";
import { render } from "@testing-library/react-native";
import { GrassLayer } from "../../app/components/garden/GrassLayer";

describe("GrassLayer", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<GrassLayer />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders grass decoration elements", () => {
    const { UNSAFE_queryAllByType } = render(<GrassLayer />);
    const texts = UNSAFE_queryAllByType("Text" as unknown as React.ComponentType);
    expect(texts.length).toBeGreaterThan(0);
  });
});
