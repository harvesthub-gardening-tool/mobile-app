import { useCallback, useEffect, useState } from "react";
import type { HubInfo } from "@harvesthub-gardening-tool/protos-typescript/auth/v2/auth_pb";
import { listHubs } from "../services/authService";

type UseHubsResult = {
    hubs: HubInfo[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};

export function useHubs(): UseHubsResult {
    const [hubs, setHubs] = useState<HubInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const next = await listHubs();
            setHubs(next);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Impossible de charger les hubs.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { hubs, loading, error, refresh };
}
