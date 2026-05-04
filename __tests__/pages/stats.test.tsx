import React from "react";
import { render } from "@testing-library/react-native";

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import Stats from "../../app/pages/stats";

describe("Stats page", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<Stats />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows page title", () => {
    const { getByText } = render(<Stats />);
    expect(getByText("Statistiques")).toBeTruthy();
  });

  it("renders day labels", () => {
    const { getByText } = render(<Stats />);
    expect(getByText("Lundi")).toBeTruthy();
    expect(getByText("Mardi")).toBeTruthy();
    expect(getByText("Dimanche")).toBeTruthy();
  });

  it("renders section titles", () => {
    const { getByText } = render(<Stats />);
    expect(getByText("Répartition de la sonde")).toBeTruthy();
    expect(getByText("Comparaison")).toBeTruthy();
    expect(getByText("Mes sondes")).toBeTruthy();
  });

  it("renders probe pills", () => {
    const { getByText } = render(<Stats />);
    expect(getByText("Sonde #1 - Jardin")).toBeTruthy();
    expect(getByText("Sonde #2 - Balcon")).toBeTruthy();
  });
});
