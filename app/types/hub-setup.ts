export type Step = "intro" | "bluetooth" | "wifi" | "succes";
export const STEPS: Step[] = ["intro", "bluetooth", "wifi", "succes"];

export type SubStepStatus = "pending" | "loading" | "done" | "error";
export type SubStep = { key: string; label: string; status: SubStepStatus };

export type WifiNetwork = { SSID: string; level: number; capabilities: string };
