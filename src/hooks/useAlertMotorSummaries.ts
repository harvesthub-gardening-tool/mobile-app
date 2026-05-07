import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MotorCommandStatus } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";
import { useAuth } from "../context/AuthContext";

export type AlertMotorSummary = {
    commandId: string;
    status: MotorCommandStatus;
    observedAt: number;
    message: string;
};

type StoredAlertMotorSummaries = Record<string, AlertMotorSummary>;

const STORAGE_KEY = "harvest_hub_alert_motor_summaries";

export function useAlertMotorSummaries() {
    const { userId } = useAuth();
    const storageKey = useMemo(
        () => (userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY),
        [userId],
    );
    const [summaries, setSummaries] = useState<StoredAlertMotorSummaries>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        AsyncStorage.getItem(storageKey)
            .then((stored) => {
                if (cancelled) return;
                if (!stored) {
                    setSummaries({});
                    setLoaded(true);
                    return;
                }

                try {
                    const parsed = JSON.parse(stored) as StoredAlertMotorSummaries;
                    setSummaries(parsed);
                } catch {
                    setSummaries({});
                }
                setLoaded(true);
            })
            .catch(() => {
                if (!cancelled) {
                    setSummaries({});
                    setLoaded(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [storageKey]);

    const persist = useCallback(
        (next: StoredAlertMotorSummaries) => {
            setSummaries(next);
            void AsyncStorage.setItem(storageKey, JSON.stringify(next));
        },
        [storageKey],
    );

    const setSummary = useCallback(
        (plantId: string, summary: AlertMotorSummary | null) => {
            const next = { ...summaries };
            if (summary) {
                next[plantId] = summary;
            } else {
                delete next[plantId];
            }
            persist(next);
        },
        [persist, summaries],
    );

    return {
        summaries,
        loaded,
        setSummary,
    };
}
