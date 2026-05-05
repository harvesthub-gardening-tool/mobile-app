import { ConnectError, Code } from "@connectrpc/connect";

// Mock the api module before importing authService
jest.mock("../../src/services/api", () => ({
  authClient: {
    login: jest.fn(),
    register: jest.fn(),
    changeEmail: jest.fn(),
    changePassword: jest.fn(),
    listHubs: jest.fn(),
    revokeHub: jest.fn(),
  },
  setStoredToken: jest.fn().mockResolvedValue(undefined),
}));

import { changeEmail, changePassword, login, register, listHubs } from "../../src/services/authService";
import { authClient, setStoredToken } from "../../src/services/api";

const mockAuthClient = authClient as jest.Mocked<typeof authClient>;
const mockSetStoredToken = setStoredToken as jest.Mock;

function makeConnectError(code: Code, message = "error"): ConnectError {
  const err = new ConnectError(message, code);
  return err;
}

describe("login", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores token and returns response on success", async () => {
    const mockRes = { token: "jwt_abc" };
    mockAuthClient.login.mockResolvedValue(mockRes as never);

    const result = await login("test@test.com", "password123");
    expect(result).toBe(mockRes);
    expect(mockSetStoredToken).toHaveBeenCalledWith("jwt_abc");
  });

  it("throws translated error for Unauthenticated", async () => {
    mockAuthClient.login.mockRejectedValue(makeConnectError(Code.Unauthenticated));
    await expect(login("x@x.com", "wrong")).rejects.toThrow(
      "Email ou mot de passe incorrect.",
    );
  });

  it("throws translated error for AlreadyExists", async () => {
    mockAuthClient.login.mockRejectedValue(makeConnectError(Code.AlreadyExists));
    await expect(login("x@x.com", "pass")).rejects.toThrow(
      "Cet email est déjà utilisé.",
    );
  });

  it("throws translated error for Unavailable", async () => {
    mockAuthClient.login.mockRejectedValue(makeConnectError(Code.Unavailable));
    await expect(login("x@x.com", "pass")).rejects.toThrow(
      "Le service est temporairement indisponible. Réessayez plus tard.",
    );
  });

  it("translates InvalidArgument with email keyword", async () => {
    mockAuthClient.login.mockRejectedValue(makeConnectError(Code.InvalidArgument, "invalid email format"));
    await expect(login("x@x.com", "pass")).rejects.toThrow(
      "Format d'email invalide.",
    );
  });

  it("translates InvalidArgument with password keyword", async () => {
    mockAuthClient.login.mockRejectedValue(makeConnectError(Code.InvalidArgument, "password too short"));
    await expect(login("x@x.com", "pass")).rejects.toThrow(
      "Le mot de passe doit contenir au moins 8 caractères.",
    );
  });
});

describe("register", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores token and returns response on success", async () => {
    const mockRes = { token: "jwt_new" };
    mockAuthClient.register.mockResolvedValue(mockRes as never);

    const result = await register("new@test.com", "password123");
    expect(result).toBe(mockRes);
    expect(mockSetStoredToken).toHaveBeenCalledWith("jwt_new");
  });

  it("throws AlreadyExists error", async () => {
    mockAuthClient.register.mockRejectedValue(makeConnectError(Code.AlreadyExists));
    await expect(register("dup@test.com", "pass")).rejects.toThrow(
      "Cet email est déjà utilisé.",
    );
  });
});

describe("changeEmail", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores refreshed token and returns response on success", async () => {
    const mockRes = { token: "jwt_new_email" };
    mockAuthClient.changeEmail.mockResolvedValue(mockRes as never);

    const result = await changeEmail("updated@test.com", "password123");

    expect(result).toBe(mockRes);
    expect(mockAuthClient.changeEmail).toHaveBeenCalledWith({
      newEmail: "updated@test.com",
      currentPassword: "password123",
    });
    expect(mockSetStoredToken).toHaveBeenCalledWith("jwt_new_email");
  });

  it("throws translated duplicate email error", async () => {
    mockAuthClient.changeEmail.mockRejectedValue(makeConnectError(Code.AlreadyExists));

    await expect(changeEmail("taken@test.com", "password123")).rejects.toThrow(
      "Cet email est déjà utilisé.",
    );
  });
});

describe("changePassword", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls changePassword on success", async () => {
    mockAuthClient.changePassword.mockResolvedValue({} as never);

    await expect(changePassword("password123", "newpass123")).resolves.toBeUndefined();
    expect(mockAuthClient.changePassword).toHaveBeenCalledWith({
      currentPassword: "password123",
      newPassword: "newpass123",
    });
  });

  it("throws translated weak password error", async () => {
    mockAuthClient.changePassword.mockRejectedValue(
      makeConnectError(Code.InvalidArgument, "password too short"),
    );

    await expect(changePassword("password123", "short")).rejects.toThrow(
      "Le mot de passe doit contenir au moins 8 caractères.",
    );
  });
});

describe("listHubs", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns hubs on success", async () => {
    const mockHubs = [{ hubName: "Hub A", id: "1" }];
    mockAuthClient.listHubs.mockResolvedValue({ hubs: mockHubs } as never);

    const result = await listHubs();
    expect(result).toEqual(mockHubs);
  });

  it("throws on error", async () => {
    mockAuthClient.listHubs.mockRejectedValue(makeConnectError(Code.Unauthenticated));
    await expect(listHubs()).rejects.toThrow("Email ou mot de passe incorrect.");
  });
});
