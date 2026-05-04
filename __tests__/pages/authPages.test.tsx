import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { TextInput, TouchableOpacity } from "react-native";

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

const mockLogin = jest.fn();
const mockRegister = jest.fn();
jest.mock("../../app/context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin, register: mockRegister }),
}));

import Login from "../../app/login";
import Signup from "../../app/signup";

beforeEach(() => jest.clearAllMocks());

// Login: [forgotPwd, submit, signup-link], Signup: [submit, login-link]
// Submit is always second-to-last (last is always the nav link inside <Link>)
function pressSubmit(
  buttons: Array<{ props: unknown }>,
) {
  fireEvent.press(buttons[buttons.length - 2]);
}

describe("Login page", () => {
  it("renders without crashing", () => {
    expect(render(<Login />).toJSON()).toBeTruthy();
  });

  it("has email and password inputs", () => {
    const { UNSAFE_getAllByType } = render(<Login />);
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThanOrEqual(2);
  });

  it("shows error on empty submit", async () => {
    const { UNSAFE_getAllByType, getByText } = render(<Login />);
    await act(async () => { pressSubmit(UNSAFE_getAllByType(TouchableOpacity)); });
    expect(getByText("Veuillez remplir tous les champs.")).toBeTruthy();
  });

  it("calls login with credentials", async () => {
    mockLogin.mockResolvedValue(undefined);
    const { UNSAFE_getAllByType } = render(<Login />);
    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], "test@test.com");
    fireEvent.changeText(inputs[1], "pass123");
    await act(async () => { pressSubmit(UNSAFE_getAllByType(TouchableOpacity)); });
    expect(mockLogin).toHaveBeenCalledWith("test@test.com", "pass123");
  });

  it("shows error when login fails", async () => {
    mockLogin.mockRejectedValue(new Error("Email ou mot de passe incorrect."));
    const { UNSAFE_getAllByType, getByText } = render(<Login />);
    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], "x@x.com");
    fireEvent.changeText(inputs[1], "wrong");
    await act(async () => { pressSubmit(UNSAFE_getAllByType(TouchableOpacity)); });
    expect(getByText("Email ou mot de passe incorrect.")).toBeTruthy();
  });
});

describe("Signup page", () => {
  it("renders without crashing", () => {
    expect(render(<Signup />).toJSON()).toBeTruthy();
  });

  it("has input fields", () => {
    const { UNSAFE_getAllByType } = render(<Signup />);
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThanOrEqual(2);
  });

  it("shows error on empty submit", async () => {
    const { UNSAFE_getAllByType, getByText } = render(<Signup />);
    await act(async () => { pressSubmit(UNSAFE_getAllByType(TouchableOpacity)); });
    expect(getByText("Veuillez remplir tous les champs.")).toBeTruthy();
  });

  it("calls register with credentials", async () => {
    mockRegister.mockResolvedValue(undefined);
    const { UNSAFE_getAllByType } = render(<Signup />);
    const inputs = UNSAFE_getAllByType(TextInput);
    // Signup has 4 inputs: email(0), prenom(1), nom(2), password(3)
    fireEvent.changeText(inputs[0], "new@test.com");
    fireEvent.changeText(inputs[3], "pass123");
    await act(async () => { pressSubmit(UNSAFE_getAllByType(TouchableOpacity)); });
    expect(mockRegister).toHaveBeenCalledWith("new@test.com", "pass123");
  });

  it("shows error when register fails", async () => {
    mockRegister.mockRejectedValue(new Error("Cet email est déjà utilisé."));
    const { UNSAFE_getAllByType, getByText } = render(<Signup />);
    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], "dup@test.com");
    fireEvent.changeText(inputs[3], "pass");
    await act(async () => { pressSubmit(UNSAFE_getAllByType(TouchableOpacity)); });
    expect(getByText("Cet email est déjà utilisé.")).toBeTruthy();
  });
});
