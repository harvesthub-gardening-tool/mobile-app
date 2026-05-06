import { useState, useEffect, useCallback } from "react";
import {
    pollMotorCommandStatus,
} from "../services/controlService";
import type { MotorCommand } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";
import { MotorCommandStatus } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";

export interface UseMotorCommandStatusOptions {
    pollIntervalMs?: number;
    maxTimeoutMs?: number;
    autoStart?: boolean;
}

export interface UseMotorCommandStatusResult {
    command: MotorCommand | null;
    status: MotorCommandStatus | null;
    isLoading: boolean;
    error: Error | null;
    isTerminal: boolean;
    timedOut: boolean;
    startPolling: () => void;
    stopPolling: () => void;
}

export function useMotorCommandStatus(
    commandId: string | null,
    options: UseMotorCommandStatusOptions = {},
): UseMotorCommandStatusResult {
    const [command, setCommand] = useState<MotorCommand | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isTerminal, setIsTerminal] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [isPolling, setIsPolling] = useState(options.autoStart ?? false);

    const stopPolling = useCallback(() => {
        setIsPolling(false);
    }, []);

    const startPolling = useCallback(() => {
        if (commandId) {
            setIsPolling(true);
        }
    }, [commandId]);

    useEffect(() => {
        if (!commandId || !isPolling) return;

        const abortController = new AbortController();

        const runPolling = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const result = await pollMotorCommandStatus(commandId, {
                    intervalMs: options.pollIntervalMs ?? 1000,
                    maxTimeoutMs: options.maxTimeoutMs ?? 30000,
                });

                if (!abortController.signal.aborted) {
                    setCommand(result.command);
                    setIsTerminal(result.isTerminal);
                    setTimedOut(result.timedOut);
                    setIsLoading(false);

                    if (result.isTerminal || result.timedOut) {
                        setIsPolling(false);
                    }
                }
            } catch (err) {
                if (!abortController.signal.aborted) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                    setIsLoading(false);
                    setIsPolling(false);
                }
            }
        };

        runPolling();

        return () => {
            abortController.abort();
        };
    }, [commandId, isPolling, options.pollIntervalMs, options.maxTimeoutMs]);

    return {
        command,
        status: command?.status ?? null,
        isLoading,
        error,
        isTerminal,
        timedOut,
        startPolling,
        stopPolling,
    };
}
