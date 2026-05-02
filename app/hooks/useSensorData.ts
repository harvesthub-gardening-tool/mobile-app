import { useState, useEffect, useCallback } from "react";
import { getSummary } from "../services/gardenService";
import type { SensorSummary } from "@harvesthub-gardening-tool/protos-typescript/garden/v1/garden_pb";

// Retourne la dernière lecture par nodeId, rafraîchie toutes les 30s
export function useSensorData(): Map<string, SensorSummary> {
    const [summaries, setSummaries] = useState<Map<string, SensorSummary>>(new Map());

    const refresh = useCallback(async () => {
        try {
            const data = await getSummary(undefined, 1); // dernière heure
            const map = new Map<string, SensorSummary>();
            for (const s of data) {
                const existing = map.get(s.nodeId);
                if (!existing || s.intervalStart > existing.intervalStart) {
                    map.set(s.nodeId, s);
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
