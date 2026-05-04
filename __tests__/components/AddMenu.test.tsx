import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import { AddMenu } from "../../app/components/garden/AddMenu";

jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
}));

describe("AddMenu", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<AddMenu onPress={jest.fn()} />);
    expect(toJSON()).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(<AddMenu onPress={onPress} />);
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
