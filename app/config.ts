import { Platform } from "react-native";

/**
 * Central configuration for the app.
 * Override API_BASE_URL to point at staging/production as needed.
 */
function getEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();

  return value ? value : undefined;
}

const API_PROTOCOL = getEnv("EXPO_PUBLIC_API_PROTOCOL") ?? "http";
const API_HOST =
  getEnv("EXPO_PUBLIC_API_HOST") ??
  (Platform.OS === "web" ? "localhost" : "127.0.0.1");
const API_PORT = getEnv("EXPO_PUBLIC_API_PORT") ?? "8080";
const API_BASE_PATH = getEnv("EXPO_PUBLIC_API_BASE_PATH") ?? "";

function sanitizeBasePath(path: string): string {
  if (!path) {
    return "";
  }

  const trimmedPath = path.trim().replace(/^\/+/, "").replace(/\/+$/, "");

  return trimmedPath ? `/${trimmedPath}` : "";
}

const fallbackBaseUrl = new URL(
  sanitizeBasePath(API_BASE_PATH) || "/",
  `${API_PROTOCOL}://${API_HOST}${API_PORT ? `:${API_PORT}` : ""}`
)
  .toString()
  .replace(/\/+$/, "");

export const API_BASE_URL =
  getEnv("EXPO_PUBLIC_API_BASE_URL") ?? fallbackBaseUrl;
