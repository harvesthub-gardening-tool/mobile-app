import { Platform } from "react-native";

/**
 * Central configuration for the app.
 * Override API_BASE_URL to point at staging/production as needed.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === "web" ? "http://localhost:8080" : "http://172.20.10.14:8080");
