import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    getStoredToken().then((token) => {
      setState({
        token,
        userId: null,
        isLoading: false,
        isAuthenticated: token !== null,
      });
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setState({ token: res.token, userId: null, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await authService.register(email, password);
    setState({ token: res.token, userId: res.userId, isLoading: false, isAuthenticated: true });
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