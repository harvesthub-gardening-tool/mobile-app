import { ConnectError, Code } from "@connectrpc/connect";
import { gardenClient } from "./api";
import type {
    InsertSensorDataResponse,
    SensorSummary,
} from "@harvesthub-gardening-tool/protos-typescript/garden/v2/garden_pb";

function translateError(err: unknown): string {
    const connectErr = ConnectError.from(err);
    switch (connectErr.code) {
        case Code.Unauthenticated:
            return "Session expirée. Veuillez vous reconnecter.";
        case Code.PermissionDenied:
            return "Accès non autorisé à ce jardin.";
        case Code.NotFound:
            return "Données du capteur introuvables.";
        case Code.Unavailable:
            return "Le service est temporairement indisponible. Réessayez plus tard.";
        default:
            return (
                connectErr.rawMessage || "Une erreur inattendue est survenue."
            );
    }
}

export async function insertSensorData(data: {
    nodeId: string;
    airTemperature: number;
    airHumidity: number;
    soilHumidity: number;
    airPressure: number;
    soilTemperature: number;
    timestamp: bigint;
}): Promise<InsertSensorDataResponse> {
    try {
        return await gardenClient.insertSensorData(data);
    } catch (err: unknown) {
        throw new Error(translateError(err));
    }
}

export async function getSummary(
    nodeId?: string,
    hours?: number,
    hubId?: string,
): Promise<SensorSummary[]> {
    try {
        const res = await gardenClient.getSummary({ nodeId, hours, hubId });
        return res.summaries;
    } catch (err: unknown) {
        throw new Error(translateError(err));
    }
}
