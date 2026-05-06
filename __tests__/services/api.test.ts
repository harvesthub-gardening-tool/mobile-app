jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@connectrpc/connect-web", () => ({
  createConnectTransport: jest.fn(() => ({})),
}));

jest.mock("@connectrpc/connect", () => ({
  createClient: jest.fn(() => ({})),
}));

jest.mock("@harvesthub-gardening-tool/protos-typescript/auth/v2/auth_pb", () => ({
  AuthService: {},
}));

jest.mock("@harvesthub-gardening-tool/protos-typescript/garden/v2/garden_pb", () => ({
  GardenService: {},
}));

jest.mock("@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb", () => ({
  ControlService: {},
}));

import * as SecureStore from "expo-secure-store";
import { getStoredToken, setStoredToken, removeStoredToken } from "../../app/services/api";

const mockGet = SecureStore.getItemAsync as jest.Mock;
const mockSet = SecureStore.setItemAsync as jest.Mock;
const mockDel = SecureStore.deleteItemAsync as jest.Mock;

describe("api — token storage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getStoredToken returns null when not set", async () => {
    mockGet.mockResolvedValue(null);
    const token = await getStoredToken();
    expect(token).toBeNull();
  });

  it("getStoredToken returns stored value", async () => {
    mockGet.mockResolvedValue("my_jwt");
    const token = await getStoredToken();
    expect(token).toBe("my_jwt");
  });

  it("setStoredToken calls SecureStore with correct key", async () => {
    await setStoredToken("abc123");
    expect(mockSet).toHaveBeenCalledWith("harvest_hub_auth_token", "abc123");
  });

  it("removeStoredToken calls SecureStore with correct key", async () => {
    await removeStoredToken();
    expect(mockDel).toHaveBeenCalledWith("harvest_hub_auth_token");
  });
});
