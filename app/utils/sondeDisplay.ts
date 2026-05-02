import type { PlacedSonde } from "../types/garden";

function normalizeHubName(name: string): string {
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed : "Hub";
}

export function getSondeDisplayName(sonde: PlacedSonde, sondes: PlacedSonde[]): string {
    const hubName = normalizeHubName(sonde.hubName);
    const sameHub = sondes.filter((item) => normalizeHubName(item.hubName) === hubName);
    const index = Math.max(0, sameHub.findIndex((item) => item.id === sonde.id));
    return `${hubName} ${index + 1}`;
}
