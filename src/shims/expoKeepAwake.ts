import { useEffect } from "react";

export const ExpoKeepAwakeTag = "ExpoKeepAwakeDefaultTag";

export type KeepAwakeOptions = {
  listener?: (event: { state: string }) => void;
  suppressDeactivateWarnings?: boolean;
};

export async function isAvailableAsync(): Promise<boolean> {
  return false;
}

export function useKeepAwake(_tag?: string, _options?: KeepAwakeOptions): void {
  useEffect(() => undefined, []);
}

export async function activateKeepAwake(): Promise<void> {
  return undefined;
}

export async function activateKeepAwakeAsync(): Promise<void> {
  return undefined;
}

export async function deactivateKeepAwake(): Promise<void> {
  return undefined;
}

export function addListener() {
  return { remove: () => undefined };
}
