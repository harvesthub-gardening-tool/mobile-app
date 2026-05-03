export type Step = "intro" | "bluetooth" | "wifi" | "succes";
export const STEPS: Step[] = ["intro", "bluetooth", "wifi", "succes"];

export type SubStepStatus = "pending" | "loading" | "done" | "error";
export type SubStep = { key: string; label: string; status: SubStepStatus };

export type WifiNetwork = { SSID: string; level: number; capabilities: string };
export type WifiCredentialsProvisioner = (ssid: string, password: string) => Promise<void>;
export type SetupFailureHandler = (error: unknown) => Promise<void>;

export class WifiCredentialsRejectedError extends Error {
    constructor(message = "Le hub n'a pas pu se connecter au WiFi. Vérifiez le réseau et le mot de passe.") {
        super(message);
        this.name = "WifiCredentialsRejectedError";
    }
}

export type HubSetupParams = {
    hub_uuid: string;
    hub_secret: string;
    hub_name: string;
};
