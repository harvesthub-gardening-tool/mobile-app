import { ConnectError, Code } from "@connectrpc/connect";
import { authClient, setStoredToken } from "./api";
import type {
  RegisterResponse,
  LoginResponse,
  HubInfo,
  ChangeEmailResponse,
} from "@harvesthub-gardening-tool/protos-typescript/auth/v2/auth_pb";

function translateError(err: unknown): string {
  const connectErr = ConnectError.from(err);
  switch (connectErr.code) {
    case Code.Unauthenticated:
      return "Email ou mot de passe incorrect.";
    case Code.AlreadyExists:
      return "Cet email est déjà utilisé.";
    case Code.InvalidArgument: {
      const msg = (connectErr.rawMessage ?? "").toLowerCase();
      if (msg.includes("email")) return "Format d'email invalide.";
      if (msg.includes("password"))
        return "Le mot de passe doit contenir au moins 8 caractères.";
      return connectErr.rawMessage || "Argument invalide.";
    }
    case Code.Unavailable:
      return "Le service est temporairement indisponible. Réessayez plus tard.";
    default:
      return connectErr.rawMessage || "Une erreur inattendue est survenue.";
  }
}

export async function register(
  email: string,
  password: string,
): Promise<RegisterResponse> {
  try {
    const res = await authClient.register({ email, password });
    await setStoredToken(res.token);
    return res;
  } catch (err: unknown) {
    throw new Error(translateError(err));
  }
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const res = await authClient.login({ email, password });
    await setStoredToken(res.token);
    return res;
  } catch (err: unknown) {
    throw new Error(translateError(err));
  }
}

export async function changeEmail(
  newEmail: string,
  currentPassword: string,
): Promise<ChangeEmailResponse> {
  try {
    const res = await authClient.changeEmail({ newEmail, currentPassword });
    await setStoredToken(res.token);
    return res;
  } catch (err: unknown) {
    throw new Error(translateError(err));
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  try {
    await authClient.changePassword({ currentPassword, newPassword });
  } catch (err: unknown) {
    throw new Error(translateError(err));
  }
}

export async function listHubs(): Promise<HubInfo[]> {
  try {
    const res = await authClient.listHubs({});
    return res.hubs;
  } catch (err: unknown) {
    throw new Error(translateError(err));
  }
}

export async function revokeHubByDeviceId(deviceId: string): Promise<boolean> {
  const hubs = await listHubs();
  const hub = hubs.find((item) => item.deviceId === deviceId && !item.revoked);
  if (!hub) return false;

  try {
    await authClient.revokeHub({ hubId: hub.id });
    return true;
  } catch (err: unknown) {
    throw new Error(translateError(err));
  }
}

export async function associateHub(
  deviceId: string,
  hubSecret: string,
  hubName: string,
): Promise<void> {
  try {
    await authClient.associateHub({ deviceId, hubSecret, hubName });
  } catch (err: unknown) {
    const connectErr = ConnectError.from(err);
    switch (connectErr.code) {
      case Code.AlreadyExists:
        return;
      case Code.PermissionDenied:
        throw new Error("QR code invalide ou expiré.");
      case Code.Unauthenticated:
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      case Code.Unavailable:
        throw new Error(
          "Le service est temporairement indisponible. Réessayez plus tard.",
        );
      default:
        throw new Error(
          connectErr.rawMessage || "Impossible d'associer le hub.",
        );
    }
  }
}
