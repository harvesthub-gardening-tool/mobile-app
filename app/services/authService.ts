import { ConnectError, Code } from "@connectrpc/connect";
import { authClient, setStoredToken } from "./api";
import type {
    RegisterResponse,
    LoginResponse,
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
            return (
                connectErr.rawMessage || "Une erreur inattendue est survenue."
            );
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
