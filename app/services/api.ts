import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthService } from "@harvesthub-gardening-tool/protos-typescript/auth/v1/auth_pb";
import { GardenService } from "@harvesthub-gardening-tool/protos-typescript/garden/v1/garden_pb";

// Change this to your actual backend URL.
// Use your machine's LAN IP for physical devices.
// localhost only works on iOS simulator; Android emulator uses 10.0.2.2.
export const API_BASE_URL = "http://10.74.253.158:8080";

const TOKEN_STORAGE_KEY = "harvest_hub_auth_token";

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export async function removeStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

export const transport = createConnectTransport({
  baseUrl: API_BASE_URL,
  interceptors: [
    (next) => async (req) => {
      const token = await getStoredToken();
      if (token) {
        req.header.set("Authorization", `Bearer ${token}`);
      }
      return next(req);
    },
  ],
});

export const authClient = createClient(AuthService, transport);
export const gardenClient = createClient(GardenService, transport);
