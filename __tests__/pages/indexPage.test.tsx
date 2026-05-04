import React from "react";
import { render } from "@testing-library/react-native";

import IndexPage from "../../app/index";

describe("Index page", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<IndexPage />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows app title", () => {
    const { getByText } = render(<IndexPage />);
    expect(getByText("Harvest Hub")).toBeTruthy();
  });
});
