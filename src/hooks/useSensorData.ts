import { useState, useEffect, useCallback } from "react";
import { listHubs } from "../services/authService";
import { getLast, listProbesForHubName } from "../services/gardenService";

export type ProbeSensorData = {
  airTemperature?: number;
  airHumidity?: number;
  soilHumidity?: number;
  soilTemperature?: number;
};

// Retourne la dernière lecture par nodeId, rafraîchie toutes les 30s
export function useSensorData(refreshSignal?: number): Map<string, ProbeSensorData> {
  const [summaries, setSummaries] = useState<Map<string, ProbeSensorData>>(
    new Map(),
  );

    const refresh = useCallback(async () => {
        try {
            const hubs = await listHubs();
            const readableHubs = hubs.filter((hub) => hub.claimed && !hub.revoked);
            const perHubResults = await Promise.allSettled(
                readableHubs.map(async (hub) => {
                    const probes = await listProbesForHubName(hub.hubName);
                    const readingResults = await Promise.allSettled(
                        probes.map(async (probe) => ({
                            probe,
                            reading: await getLast(probe.nodeId),
                        })),
                    );

                    return readingResults.flatMap((result) =>
                        result.status === "fulfilled" ? [result.value] : [],
                    );
                }),
            );

            const map = new Map<string, ProbeSensorData>();
            for (const readings of perHubResults.flatMap((result) =>
                result.status === "fulfilled" ? [result.value] : [],
            )) {
                for (const { probe, reading } of readings) {
          map.set(probe.nodeId, {
            airTemperature: reading?.airTemperature ?? probe.airTemperature,
            airHumidity: reading?.airHumidity ?? probe.airHumidity,
            soilHumidity: reading?.soilHumidity,
            soilTemperature: reading?.soilTemperature,
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
    }, [refresh, refreshSignal]);

  return summaries;
}
