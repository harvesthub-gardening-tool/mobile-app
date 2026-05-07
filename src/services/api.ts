import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import * as SecureStore from "expo-secure-store";
import { AuthService } from "@harvesthub-gardening-tool/protos-typescript/auth/v2/auth_pb";
import { ChatService } from "@harvesthub-gardening-tool/protos-typescript/chat/v1/chat_pb";
import { GardenService } from "@harvesthub-gardening-tool/protos-typescript/garden/v2/garden_pb";
import { ControlService } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";
import { API_BASE_URL } from "../config";

export { API_BASE_URL };

const TOKEN_STORAGE_KEY = "harvest_hub_auth_token";

export async function getStoredToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
}

export async function removeStoredToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
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
export const controlClient = createClient(ControlService, transport);
export const chatClient = createClient(ChatService, transport);
