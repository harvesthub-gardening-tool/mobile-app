import { useState, useEffect, useCallback } from "react";
import { listHubs } from "../services/authService";
import { getSummary, listProbesForHubName } from "../services/gardenService";
import type { SensorSummary } from "@harvesthub-gardening-tool/protos-typescript/garden/v2/garden_pb";

export type ProbeSensorData = {
    airTemperature?: number;
    airHumidity?: number;
};

// Retourne la dernière lecture par nodeId, rafraîchie toutes les 30s
export function useSensorData(): Map<string, ProbeSensorData> {
    const [summaries, setSummaries] = useState<Map<string, ProbeSensorData>>(new Map());

    const refresh = useCallback(async () => {
        try {
            const hubs = await listHubs();
            const perHubData = await Promise.all(
                hubs.map(async (hub) => {
                    const [probes, summaryRows] = await Promise.all([
                        listProbesForHubName(hub.hubName),
                        getSummary(undefined, 24, hub.id),
                    ]);

                    const latestSummaryByNode = new Map<string, SensorSummary>();
                    for (const row of summaryRows) {
                        const existing = latestSummaryByNode.get(row.nodeId);
                        if (!existing || row.intervalStart > existing.intervalStart) {
                            latestSummaryByNode.set(row.nodeId, row);
                        }
                    }

                    return { probes, latestSummaryByNode };
                }),
            );

            const map = new Map<string, ProbeSensorData>();
            for (const { probes, latestSummaryByNode } of perHubData) {
                for (const probe of probes) {
                    const summary = latestSummaryByNode.get(probe.nodeId);
                    map.set(probe.nodeId, {
                        airTemperature:
                            probe.airTemperature ?? summary?.avgAirTemperature,
                        airHumidity:
                            probe.airHumidity ?? summary?.avgAirHumidity,
                    });
                }
            }

            setSummaries(map);
        } catch {
            // silencieux si pas de connexion
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 30_000);
        return () => clearInterval(interval);
    }, [refresh]);

    return summaries;
}
