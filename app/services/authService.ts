import { authClient, setStoredToken } from "./api";
import type {
  RegisterResponse,
  LoginResponse,
} from "@harvesthub-gardening-tool/protos-typescript/auth/v1/auth_pb";

const errorMessages: Record<string, string> = {
  "invalid email or password": "Email ou mot de passe incorrect.",
  "invalid email format": "Format d'email invalide.",
  "password must be at least 8 characters": "Le mot de passe doit contenir au moins 8 caractères.",
};

function translateError(message: string): string {
  if (message.startsWith("email already registered")) {
    return "Cet email est déjà utilisé.";
  }
  return errorMessages[message] || message;
}

export async function register(
  email: string,
  password: string
): Promise<RegisterResponse> {
  try {
    const res = await authClient.register({ email, password });
    await setStoredToken(res.token);
    return res;
  } catch (err: any) {
    throw new Error(translateError(err?.message || "Échec de l'inscription."));
  }
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const res = await authClient.login({ email, password });
    await setStoredToken(res.token);
    return res;
  } catch (err: any) {
    throw new Error(translateError(err?.message || "Échec de la connexion."));
  }
}
