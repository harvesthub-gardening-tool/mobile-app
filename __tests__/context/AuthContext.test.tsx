import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../../src/context/AuthContext";

jest.mock("../../src/services/api", () => ({
  getStoredToken: jest.fn().mockResolvedValue(null),
  removeStoredToken: jest.fn().mockResolvedValue(undefined),
  setStoredToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/services/authService", () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
}));

import { getStoredToken, removeStoredToken } from "../../src/services/api";
import * as authService from "../../src/services/authService";

const mockGetToken = getStoredToken as jest.Mock;
const mockRemoveToken = removeStoredToken as jest.Mock;
const mockLogin = authService.login as jest.Mock;
const mockRegister = authService.register as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToken.mockResolvedValue(null);
});

describe("AuthContext — initial state", () => {
  it("starts loading with no token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("resolves to unauthenticated when no stored token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it("resolves as authenticated with valid token", async () => {
    // JWT: header.payload.sig — payload has sub and future exp
    const payload = btoa(JSON.stringify({ sub: "user_42", exp: Math.floor(Date.now() / 1000) + 3600 }));
    const fakeJwt = `header.${payload}.sig`;
    mockGetToken.mockResolvedValue(fakeJwt);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe("user_42");
  });

  it("clears expired token", async () => {
    const payload = btoa(JSON.stringify({ sub: "u1", exp: 1 })); // already expired
    mockGetToken.mockResolvedValue(`h.${payload}.s`);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mockRemoveToken).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe("AuthContext — login", () => {
  it("sets authenticated state after login", async () => {
    const payload = btoa(JSON.stringify({ sub: "user_1" }));
    mockLogin.mockResolvedValue({ token: `h.${payload}.s` });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.login("a@b.com", "pass123");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe("user_1");
  });

  it("propagates login error", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await expect(
      act(async () => { await result.current.login("x@x.com", "wrong"); }),
    ).rejects.toThrow("Invalid credentials");
  });
});

describe("AuthContext — refreshToken", () => {
  it("updates authenticated state from a refreshed token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const payload = btoa(JSON.stringify({ user_id: "user_refreshed", username: "new@test.com" }));
    await act(async () => {
      result.current.refreshToken(`h.${payload}.s`);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe("user_refreshed");
  });
});

describe("AuthContext — logout", () => {
  it("clears state and removes token", async () => {
    const payload = btoa(JSON.stringify({ sub: "user_1", exp: Math.floor(Date.now() / 1000) + 3600 }));
    mockGetToken.mockResolvedValue(`h.${payload}.s`);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(mockRemoveToken).toHaveBeenCalled();
  });
});

describe("AuthContext — register", () => {
  it("calls register service", async () => {
    mockRegister.mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.register("new@test.com", "password");
    });

    expect(mockRegister).toHaveBeenCalledWith("new@test.com", "password");
  });
});

describe("useAuth — outside provider", () => {
  it("throws when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");
  });
});
