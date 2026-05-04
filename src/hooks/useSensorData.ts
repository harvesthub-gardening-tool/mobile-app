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
export function useSensorData(): Map<string, ProbeSensorData> {
  const [summaries, setSummaries] = useState<Map<string, ProbeSensorData>>(
    new Map(),
  );

  const refresh = useCallback(async () => {
    try {
      const hubs = await listHubs();
      const perHubData = await Promise.all(
        hubs.map(async (hub) => {
          const probes = await listProbesForHubName(hub.hubName);
          const readings = await Promise.all(
            probes.map(async (probe) => ({
              probe,
              reading: await getLast(probe.nodeId),
            })),
          );

          return readings;
        }),
      );

      const map = new Map<string, ProbeSensorData>();
      for (const readings of perHubData) {
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
  }, [refresh]);

  return summaries;
}
