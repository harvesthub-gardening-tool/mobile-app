import { ConnectError, Code } from "@connectrpc/connect";
import { controlClient } from "./api";
import type { MotorCommand } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";
import {
    MotorCommandStatus,
    MotorCommandAction,
    MotorCommandReasonCode,
} from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";

export interface CreateMotorCommandResponse {
    command?: MotorCommand;
}

export interface GetMotorCommandStatusResponse {
    command: MotorCommand;
}

export interface MotorReasonPresentation {
    reasonCode: MotorCommandReasonCode;
    message: string;
}

/**
 * Terminal statuses where polling should stop.
 * Commands in these states will not transition further.
 */
const TERMINAL_STATUSES = new Set<MotorCommandStatus>([
    MotorCommandStatus.SUCCEEDED,
    MotorCommandStatus.FAILED,
    MotorCommandStatus.EXPIRED,
    MotorCommandStatus.CANCELLED,
]);



/**
 * Translates Connect RPC errors to French user-facing messages.
 */
function translateError(err: unknown): string {
    const connectErr = ConnectError.from(err);
    switch (connectErr.code) {
        case Code.Unauthenticated:
            return "Session expirée. Veuillez vous reconnecter.";
        case Code.PermissionDenied:
            return "Accès non autorisé à cette commande moteur.";
        case Code.NotFound:
            return "Commande introuvable ou nœud non trouvé.";
        case Code.FailedPrecondition:
            return "Une commande moteur est déjà en cours pour ce nœud.";
        case Code.InvalidArgument:
            return "Paramètres invalides. Veuillez vérifier la durée et le nœud.";
        case Code.Unavailable:
            return "Le service est temporairement indisponible. Réessayez plus tard.";
        default:
            return "Une erreur inattendue est survenue.";
    }
}

/**
 * Maps backend motor reason codes to stable French user-facing messages.
 * Operator/developer table stays aligned with backend/hub/probe observability names.
 */
export function getMotorReasonMessage(reasonCode?: MotorCommandReasonCode | null): string | null {
    switch (reasonCode) {
        case MotorCommandReasonCode.UART_TIMEOUT:
            return "La sonde a répondu trop tard au contrôleur moteur. Réessayez.";
        case MotorCommandReasonCode.PROBE_UNREACHABLE:
            return "La sonde est injoignable pour cette commande. Vérifiez sa connexion.";
        case MotorCommandReasonCode.EXPIRED:
            return "La commande a expiré avant de pouvoir être exécutée.";
        case MotorCommandReasonCode.UART_REJECTED:
            return "Le contrôleur moteur a rejeté la commande envoyée.";
        case MotorCommandReasonCode.BLE_WRITE_FAILED:
            return "Le hub n'a pas pu transmettre la commande à la sonde.";
        case MotorCommandReasonCode.DUPLICATE:
            return "Cette commande moteur a déjà été prise en compte.";
        case MotorCommandReasonCode.SAFETY_LIMIT_EXCEEDED:
            return "La commande dépasse la limite de sécurité autorisée.";
        case MotorCommandReasonCode.UNAUTHORIZED:
            return "Vous n'êtes pas autorisé à piloter cette sonde.";
        case MotorCommandReasonCode.NONE:
        case MotorCommandReasonCode.UNSPECIFIED:
        case undefined:
        case null:
            return null;
        default:
            return "La commande moteur a échoué. Vous pouvez réessayer.";
    }
}

export function getMotorReasonPresentation(command?: MotorCommand | null): MotorReasonPresentation | null {
    if (!command) {
        return null;
    }

    const message = getMotorReasonMessage(command.reasonCode);
    if (!message) {
        return null;
    }

    return {
        reasonCode: command.reasonCode,
        message,
    };
}

/**
 * Generates a stable idempotency key for a motor command invocation.
 * By default, uses a timestamp + random suffix to ensure uniqueness per button press.
 * Callers can optionally provide their own key for explicit deduplication.
 *
 * @param customKey - Optional custom idempotency key. If provided, it will be used as-is.
 * @returns A stable idempotency key string.
 */
export function generateIdempotencyKey(customKey?: string): string {
    if (customKey) {
        return customKey;
    }
    // Generate: timestamp_randomSuffix
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `${timestamp}_${randomSuffix}`;
}

/**
 * Creates a motor command for a specified node and duration.
 * Returns the command ID and initial status; does not wait for execution completion.
 *
 * @param hubId - The hub identifier (required for backend authorization)
 * @param nodeId - The probe/node identifier
 * @param durationMs - Duration in milliseconds (will be clamped by backend to 5000ms max)
 * @param customIdempotencyKey - Optional custom idempotency key for explicit deduplication
 * @returns Object containing commandId, status, and optional reason details
 * @throws Error with translated French message on auth, permission, or backend failures
 */
export async function createMotorCommand(
    hubId: string,
    nodeId: string,
    durationMs: number,
    customIdempotencyKey?: string,
): Promise<CreateMotorCommandResponse> {
    try {
        const idempotencyKey = generateIdempotencyKey(customIdempotencyKey);

        const response = await controlClient.createMotorCommand({
            hubId,
            idempotencyKey,
            nodeId,
            action: MotorCommandAction.RUN_FOR_DURATION,
            durationMs,
        });

        return {
            command: response.command,
        };
    } catch (err: unknown) {
        throw new Error(translateError(err));
    }
}

/**
 * Gets the current status of a motor command.
 * Fetches the latest command state and reason metadata.
 *
 * @param commandId - The command identifier
 * @returns Object containing the full MotorCommand object with current status
 * @throws Error with translated French message on auth, permission, or backend failures
 */
export async function getMotorCommandStatus(commandId: string): Promise<MotorCommand> {
    try {
        const response = await controlClient.getMotorCommandStatus({
            commandId,
        });

        if (!response.command) {
            throw new Error("Commande introuvable ou nœud non trouvé.");
        }

        return response.command;
    } catch (err: unknown) {
        const connectErr = ConnectError.from(err);
        if (connectErr.code !== Code.Unknown) {
            throw new Error(translateError(err));
        }
        throw err;
    }
}

export interface MotorCommandStatusPollOptions {
    intervalMs?: number;
    maxTimeoutMs?: number;
    onStatusChange?: (status: MotorCommandStatus, command: MotorCommand) => void;
}

export interface MotorCommandStatusPollResult {
    command: MotorCommand;
    isTerminal: boolean;
    timedOut: boolean;
}

/**
 * Polls for a motor command status update until terminal state or timeout.
 * Stops polling on terminal statuses: SUCCEEDED, FAILED, EXPIRED, CANCELLED.
 * Also stops if polling duration exceeds maxTimeoutMs.
 *
 * @param commandId - The command identifier to poll
 * @param options - Polling configuration
 * @param options.intervalMs - Time between polls in milliseconds (default: 1000)
 * @param options.maxTimeoutMs - Maximum total polling duration in milliseconds (default: 80000)
 * @param options.onStatusChange - Optional callback fired on each status change
 * @returns Result containing final command state, terminal flag, and timeout flag
 * @throws Error on network failure or permission issues
 */
export async function pollMotorCommandStatus(
    commandId: string,
    options: MotorCommandStatusPollOptions = {},
): Promise<MotorCommandStatusPollResult> {
    const intervalMs = options.intervalMs ?? 1000;
    const maxTimeoutMs = options.maxTimeoutMs ?? 80000;
    const onStatusChange = options.onStatusChange;

    const startTime = Date.now();
    let lastStatus: MotorCommandStatus | null = null;

    while (true) {
        const command = await getMotorCommandStatus(commandId);
        const isTerminal = TERMINAL_STATUSES.has(command.status);

        if (command.status !== lastStatus && onStatusChange) {
            onStatusChange(command.status, command);
        }
        lastStatus = command.status;

        if (isTerminal) {
            return { command, isTerminal: true, timedOut: false };
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= maxTimeoutMs) {
            return { command, isTerminal: false, timedOut: true };
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
}
