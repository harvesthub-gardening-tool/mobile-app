import { authClient, setStoredToken } from "./api";
import type {
  RegisterResponse,
  LoginResponse,
  CreateHubTokenResponse,
  HubTokenInfo,
} from "@harvesthub-gardening-tool/protos-typescript/auth/v1/auth_pb";

export async function register(
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const res = await authClient.register({ email, password });
  await setStoredToken(res.token);
  return res;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await authClient.login({ email, password });
  await setStoredToken(res.token);
  return res;
}

export async function createHubToken(
  hubName: string,
): Promise<CreateHubTokenResponse> {
  return authClient.createHubToken({ hubName });
}

export async function listHubTokens(): Promise<HubTokenInfo[]> {
  const res = await authClient.listHubTokens({});
  return res.tokens;
}

export async function revokeHubToken(tokenId: string): Promise<void> {
  await authClient.revokeHubToken({ tokenId });
}
