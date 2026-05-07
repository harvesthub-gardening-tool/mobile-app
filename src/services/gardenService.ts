import { ConnectError, Code } from "@connectrpc/connect";
import { API_BASE_URL, gardenClient, getStoredToken } from "./api";
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

type RawProbe = {
    nodeId?: string;
    node_id?: string;
    airTemperature?: number;
    air_temperature?: number;
    airHumidity?: number;
    air_humidity?: number;
};

type ListProbesForHubNameResponse = {
    probes?: RawProbe[];
};

type RawSensorReading = {
    nodeId?: string;
    node_id?: string;
    time?: number | string;
    airTemperature?: number;
    air_temperature?: number;
    airPressure?: number;
    air_pressure?: number;
    airHumidity?: number;
    air_humidity?: number;
    soilTemperature?: number;
    soil_temperature?: number;
    soilHumidity?: number;
    soil_humidity?: number;
};

type GetLastResponse = {
    reading?: RawSensorReading;
};

export type ProbeSnapshot = {
    nodeId: string;
    airTemperature?: number;
    airHumidity?: number;
};

export type LastSensorReading = {
    nodeId: string;
    time?: number;
    airTemperature?: number;
    airPressure?: number;
    airHumidity?: number;
    soilTemperature?: number;
    soilHumidity?: number;
};

function readOptionalNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readSensorNumber(value: unknown): number {
    return readOptionalNumber(value) ?? 0;
}

function readOptionalTimestamp(value: unknown): number | undefined {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
}

export async function listProbesForHubName(hubName: string): Promise<ProbeSnapshot[]> {
    const token = await getStoredToken();
    if (!token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    const response = await fetch(
        `${API_BASE_URL}/garden.v2.GardenService/ListProbesForHubName`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ hubName }),
        },
    );

    if (!response.ok) {
        throw new Error("Impossible de charger les sondes du hub.");
    }

    const payload = (await response.json()) as ListProbesForHubNameResponse;
    const snapshots: ProbeSnapshot[] = [];
    for (const probe of payload.probes ?? []) {
        const nodeId = probe.nodeId ?? probe.node_id;
        if (typeof nodeId !== "string" || nodeId.length === 0) {
            continue;
        }
        snapshots.push({
            nodeId,
            airTemperature: readOptionalNumber(
                probe.airTemperature ?? probe.air_temperature,
            ),
            airHumidity: readOptionalNumber(
                probe.airHumidity ?? probe.air_humidity,
            ),
        });
    }
    return snapshots;
}

export async function getLast(nodeId: string): Promise<LastSensorReading | null> {
    const token = await getStoredToken();
    if (!token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    const response = await fetch(
        `${API_BASE_URL}/garden.v2.GardenService/GetLast`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ node_id: nodeId }),
        },
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error("Impossible de charger la dernière lecture de la sonde.");
    }

    const payload = (await response.json()) as GetLastResponse;
    const reading = payload.reading;
    const readingNodeId = reading?.nodeId ?? reading?.node_id;
    if (typeof readingNodeId !== "string" || readingNodeId.length === 0) {
        return null;
    }

    return {
        nodeId: readingNodeId,
        time: readOptionalTimestamp(reading?.time),
        airTemperature: readSensorNumber(reading?.airTemperature ?? reading?.air_temperature),
        airPressure: readSensorNumber(reading?.airPressure ?? reading?.air_pressure),
        airHumidity: readSensorNumber(reading?.airHumidity ?? reading?.air_humidity),
        soilTemperature: readSensorNumber(reading?.soilTemperature ?? reading?.soil_temperature),
        soilHumidity: readSensorNumber(reading?.soilHumidity ?? reading?.soil_humidity),
    };
}
