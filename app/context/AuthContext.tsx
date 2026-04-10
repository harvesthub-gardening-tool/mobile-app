import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, useSegments } from "expo-router";
import { getStoredToken, removeStoredToken } from "../services/api";
import * as authService from "../services/authService";

interface AuthState {
  token: string | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

function base64Decode(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  const input = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  for (let i = 0; i < padded.length; i += 4) {
    const a = chars.indexOf(padded[i]);
    const b = chars.indexOf(padded[i + 1]);
    const c = chars.indexOf(padded[i + 2]);
    const d = chars.indexOf(padded[i + 3]);
    output += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== 64) output += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    if (d !== 64) output += String.fromCharCode(((c & 3) << 6) | d);
  }
  return output;
}

interface JwtPayload {
  sub?: string;
  user_id?: string;
  exp?: number;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64Decode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) return false;
  return Date.now() / 1000 > payload.exp;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    getStoredToken().then(async (token) => {
      const payload = token ? decodeJwtPayload(token) : null;
      const expired = isTokenExpired(payload);
      if (token && expired) {
        await removeStoredToken();
        token = null;
      }
      setState({
        token,
        userId: payload && !expired ? (payload.sub || payload.user_id || null) : null,
        isLoading: false,
        isAuthenticated: token !== null,
      });
    });
  }, []);

  useEffect(() => {
    if (state.isLoading) return;
    const inAuthPages = segments[0] === "login" || segments[0] === "signup";
    const inDashboard = segments[0] === "pages";
    if (!state.isAuthenticated && !inAuthPages) {
      router.replace("/login");
    } else if (state.isAuthenticated && !inDashboard) {
      router.replace("/pages/dashboard");
    }
  }, [state.isAuthenticated, state.isLoading, segments]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const payload = decodeJwtPayload(res.token);
    setState({ token: res.token, userId: payload?.sub || payload?.user_id || null, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await authService.register(email, password);
    router.replace("/login");
  }, []);

  const logout = useCallback(async () => {
    await removeStoredToken();
    setState({ token: null, userId: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
