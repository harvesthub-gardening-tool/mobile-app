jest.mock("../../app/services/api", () => ({
  controlClient: {
    createMotorCommand: jest.fn(),
    getMotorCommandStatus: jest.fn(),
  },
}));

import {
  createMotorCommand,
  generateIdempotencyKey,
  getMotorReasonMessage,
  getMotorReasonPresentation,
  getMotorCommandStatus,
  pollMotorCommandStatus,
} from "../../app/services/controlService";
import { controlClient } from "../../app/services/api";
import { ConnectError, Code } from "@connectrpc/connect";
import {
  MotorCommandStatus,
  MotorCommandAction,
  MotorCommandReasonCode,
  MotorCommand,
} from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";

const mockClient = controlClient as jest.Mocked<typeof controlClient>;

describe("generateIdempotencyKey", () => {
  it("returns custom key when provided", () => {
    const customKey = "my-custom-key";
    const result = generateIdempotencyKey(customKey);
    expect(result).toBe("my-custom-key");
  });

  it("generates key with timestamp and random suffix when not provided", () => {
    const result = generateIdempotencyKey();
    expect(result).toMatch(/^\d+_[a-z0-9]+$/);
  });

  it("generates unique keys on consecutive calls", () => {
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();
    expect(key1).not.toBe(key2);
  });
});

describe("createMotorCommand", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls controlClient with correct parameters including hubId", async () => {
    mockClient.createMotorCommand.mockResolvedValue({
      command: {
        commandId: "cmd-123",
        status: MotorCommandStatus.QUEUED,
        reasonCode: MotorCommandReasonCode.NONE,
        reasonMessage: "",
      },
    } as never);

    await createMotorCommand("hub-001", "node-abc", 1000, "my-idempotency-key");

    expect(mockClient.createMotorCommand).toHaveBeenCalledWith({
      hubId: "hub-001",
      idempotencyKey: "my-idempotency-key",
      nodeId: "node-abc",
      action: MotorCommandAction.RUN_FOR_DURATION,
      durationMs: 1000,
    });
  });

  it("passes hubId, nodeId, and duration correctly", async () => {
    mockClient.createMotorCommand.mockResolvedValue({
      command: {
        commandId: "cmd-456",
        status: MotorCommandStatus.QUEUED,
        reasonCode: MotorCommandReasonCode.NONE,
        reasonMessage: "",
      },
    } as never);

    await createMotorCommand("hub-xyz", "node-probe-5", 2500);

    const callArgs = mockClient.createMotorCommand.mock.calls[0][0];
    expect(callArgs.hubId).toBe("hub-xyz");
    expect(callArgs.nodeId).toBe("node-probe-5");
    expect(callArgs.durationMs).toBe(2500);
  });

  it("generates idempotency key when not provided", async () => {
    mockClient.createMotorCommand.mockResolvedValue({
      command: {
        commandId: "cmd-789",
        status: MotorCommandStatus.QUEUED,
        reasonCode: MotorCommandReasonCode.NONE,
        reasonMessage: "",
      },
    } as never);

    await createMotorCommand("hub-a", "node-b", 500);

    const callArgs = mockClient.createMotorCommand.mock.calls[0][0];
    expect(callArgs.idempotencyKey).toMatch(/^\d+_[a-z0-9]+$/);
    expect(callArgs.hubId).toBe("hub-a");
    expect(callArgs.nodeId).toBe("node-b");
    expect(callArgs.action).toBe(MotorCommandAction.RUN_FOR_DURATION);
  });

  it("returns command response with all fields", async () => {
    mockClient.createMotorCommand.mockResolvedValue({
      command: {
        commandId: "cmd-final",
        status: MotorCommandStatus.LEASED_TO_HUB,
        reasonCode: MotorCommandReasonCode.NONE,
        reasonMessage: "Command leased to hub",
      },
    } as never);

    const result = await createMotorCommand("hub-test", "node-test", 1500);

    expect(result.command?.commandId).toBe("cmd-final");
    expect(result.command?.status).toBe(MotorCommandStatus.LEASED_TO_HUB);
    expect(result.command?.reasonCode).toBe(MotorCommandReasonCode.NONE);
    expect(result.command?.reasonMessage).toBe("Command leased to hub");
  });

  it("omits undefined reasonMessage", async () => {
    mockClient.createMotorCommand.mockResolvedValue({
      command: {
        commandId: "cmd-000",
        status: MotorCommandStatus.QUEUED,
        reasonCode: MotorCommandReasonCode.NONE,
        reasonMessage: "",
      },
    } as never);

    const result = await createMotorCommand("hub-x", "node-x", 1000);

    // Empty string should be preserved as it comes from proto
    expect(result.command?.reasonMessage).toBe("");
  });

  it("throws translated error on Unauthenticated", async () => {
    mockClient.createMotorCommand.mockRejectedValue(
      new ConnectError("unauth", Code.Unauthenticated),
    );

    await expect(createMotorCommand("hub-1", "node-1", 1000)).rejects.toThrow(
      "Session expirée. Veuillez vous reconnecter.",
    );
  });

  it("throws translated error on PermissionDenied", async () => {
    mockClient.createMotorCommand.mockRejectedValue(
      new ConnectError("forbidden", Code.PermissionDenied),
    );

    await expect(createMotorCommand("hub-1", "node-1", 1000)).rejects.toThrow(
      "Accès non autorisé à cette commande moteur.",
    );
  });

  it("throws translated error on NotFound", async () => {
    mockClient.createMotorCommand.mockRejectedValue(
      new ConnectError("not found", Code.NotFound),
    );

    await expect(createMotorCommand("hub-1", "node-1", 1000)).rejects.toThrow(
      "Commande introuvable ou nœud non trouvé.",
    );
  });

  it("throws translated error on FailedPrecondition (one-active command)", async () => {
    mockClient.createMotorCommand.mockRejectedValue(
      new ConnectError("already running", Code.FailedPrecondition),
    );

    await expect(createMotorCommand("hub-1", "node-1", 1000)).rejects.toThrow(
      "Une commande moteur est déjà en cours pour ce nœud.",
    );
  });

  it("throws translated error on InvalidArgument", async () => {
    mockClient.createMotorCommand.mockRejectedValue(
      new ConnectError("invalid params", Code.InvalidArgument),
    );

    await expect(createMotorCommand("hub-1", "node-1", 1000)).rejects.toThrow(
      "Paramètres invalides. Veuillez vérifier la durée et le nœud.",
    );
  });

  it("throws translated error on Unavailable", async () => {
    mockClient.createMotorCommand.mockRejectedValue(
      new ConnectError("service down", Code.Unavailable),
    );

    await expect(createMotorCommand("hub-1", "node-1", 1000)).rejects.toThrow(
      "Le service est temporairement indisponible. Réessayez plus tard.",
    );
  });

  it("throws generic translated error for unknown codes", async () => {
    mockClient.createMotorCommand.mockRejectedValue(
      new ConnectError("internal error", Code.Internal),
    );

    await expect(createMotorCommand("hub-1", "node-1", 1000)).rejects.toThrow(
      "Une erreur inattendue est survenue.",
    );
  });

  it("throws generic translated error for Data loss and other unknown codes", async () => {
    mockClient.createMotorCommand.mockRejectedValue(
      new ConnectError("data loss", Code.DataLoss),
    );

    await expect(createMotorCommand("hub-1", "node-1", 1000)).rejects.toThrow(
      "Une erreur inattendue est survenue.",
    );
  });
});

describe("getMotorCommandStatus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns command when found", async () => {
    const mockCommand = {
      commandId: "cmd-123",
      status: MotorCommandStatus.SUCCEEDED,
      reasonCode: MotorCommandReasonCode.NONE,
      reasonMessage: "Success",
    } as MotorCommand;

    mockClient.getMotorCommandStatus.mockResolvedValue({
      command: mockCommand,
    } as never);

    const result = await getMotorCommandStatus("cmd-123");

    expect(result).toBe(mockCommand);
    expect(mockClient.getMotorCommandStatus).toHaveBeenCalledWith({
      commandId: "cmd-123",
    });
  });

  it("throws error when command response is null", async () => {
    mockClient.getMotorCommandStatus.mockResolvedValue({
      command: null,
    } as never);

    await expect(getMotorCommandStatus("cmd-invalid")).rejects.toThrow(
      "Commande introuvable ou nœud non trouvé.",
    );
  });

  it("throws translated error on Unauthenticated", async () => {
    mockClient.getMotorCommandStatus.mockRejectedValue(
      new ConnectError("unauth", Code.Unauthenticated),
    );

    await expect(getMotorCommandStatus("cmd-1")).rejects.toThrow(
      "Session expirée. Veuillez vous reconnecter.",
    );
  });

  it("throws translated error on PermissionDenied", async () => {
    mockClient.getMotorCommandStatus.mockRejectedValue(
      new ConnectError("forbidden", Code.PermissionDenied),
    );

    await expect(getMotorCommandStatus("cmd-1")).rejects.toThrow(
      "Accès non autorisé à cette commande moteur.",
    );
  });

  it("throws translated error on NotFound", async () => {
    mockClient.getMotorCommandStatus.mockRejectedValue(
      new ConnectError("not found", Code.NotFound),
    );

    await expect(getMotorCommandStatus("cmd-1")).rejects.toThrow(
      "Commande introuvable ou nœud non trouvé.",
    );
  });
});

describe("motor reason mapping", () => {
  it("maps UART_TIMEOUT to a stable French user message", () => {
    expect(getMotorReasonMessage(MotorCommandReasonCode.UART_TIMEOUT)).toBe(
      "La sonde a répondu trop tard au contrôleur moteur. Réessayez.",
    );
  });

  it("maps PROBE_UNREACHABLE to a stable French user message", () => {
    expect(getMotorReasonMessage(MotorCommandReasonCode.PROBE_UNREACHABLE)).toBe(
      "La sonde est injoignable pour cette commande. Vérifiez sa connexion.",
    );
  });

  it("maps EXPIRED to a stable French user message", () => {
    expect(getMotorReasonMessage(MotorCommandReasonCode.EXPIRED)).toBe(
      "La commande a expiré avant de pouvoir être exécutée.",
    );
  });

  it("returns a presentation object for command reason metadata", () => {
    const command = {
      commandId: "cmd-reason-1",
      status: MotorCommandStatus.FAILED,
      reasonCode: MotorCommandReasonCode.UART_TIMEOUT,
      reasonMessage: "backend internal detail not shown to user",
    } as MotorCommand;

    expect(getMotorReasonPresentation(command)).toEqual({
      reasonCode: MotorCommandReasonCode.UART_TIMEOUT,
      message: "La sonde a répondu trop tard au contrôleur moteur. Réessayez.",
    });
  });
});

describe("pollMotorCommandStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns immediately when command is in terminal SUCCEEDED status", async () => {
    const mockCommand = {
      commandId: "cmd-123",
      status: MotorCommandStatus.SUCCEEDED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    mockClient.getMotorCommandStatus.mockResolvedValue({
      command: mockCommand,
    } as never);

    const result = await pollMotorCommandStatus("cmd-123", {
      intervalMs: 10,
      maxTimeoutMs: 5000,
    });

    expect(result.command).toBe(mockCommand);
    expect(result.isTerminal).toBe(true);
    expect(result.timedOut).toBe(false);
    expect(mockClient.getMotorCommandStatus).toHaveBeenCalledTimes(1);
  });

  it("returns immediately when command is in terminal FAILED status", async () => {
    const mockCommand = {
      commandId: "cmd-456",
      status: MotorCommandStatus.FAILED,
      reasonCode: MotorCommandReasonCode.PROBE_UNREACHABLE,
      reasonMessage: "Probe not reachable",
    } as MotorCommand;

    mockClient.getMotorCommandStatus.mockResolvedValue({
      command: mockCommand,
    } as never);

    const result = await pollMotorCommandStatus("cmd-456", {
      intervalMs: 10,
      maxTimeoutMs: 5000,
    });

    expect(result.command.status).toBe(MotorCommandStatus.FAILED);
    expect(result.isTerminal).toBe(true);
    expect(result.timedOut).toBe(false);
  });

  it("returns immediately when command is in terminal EXPIRED status", async () => {
    const mockCommand = {
      commandId: "cmd-789",
      status: MotorCommandStatus.EXPIRED,
      reasonCode: MotorCommandReasonCode.EXPIRED,
    } as MotorCommand;

    mockClient.getMotorCommandStatus.mockResolvedValue({
      command: mockCommand,
    } as never);

    const result = await pollMotorCommandStatus("cmd-789", {
      intervalMs: 10,
      maxTimeoutMs: 5000,
    });

    expect(result.command.status).toBe(MotorCommandStatus.EXPIRED);
    expect(result.isTerminal).toBe(true);
    expect(result.timedOut).toBe(false);
  });

  it("returns immediately when command is in terminal CANCELLED status", async () => {
    const mockCommand = {
      commandId: "cmd-cancel",
      status: MotorCommandStatus.CANCELLED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    mockClient.getMotorCommandStatus.mockResolvedValue({
      command: mockCommand,
    } as never);

    const result = await pollMotorCommandStatus("cmd-cancel", {
      intervalMs: 10,
      maxTimeoutMs: 5000,
    });

    expect(result.command.status).toBe(MotorCommandStatus.CANCELLED);
    expect(result.isTerminal).toBe(true);
    expect(result.timedOut).toBe(false);
  });

  it("polls multiple times until reaching terminal status", async () => {
    const queuedCommand = {
      commandId: "cmd-poll",
      status: MotorCommandStatus.QUEUED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    const executingCommand = {
      commandId: "cmd-poll",
      status: MotorCommandStatus.EXECUTING,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    const succeededCommand = {
      commandId: "cmd-poll",
      status: MotorCommandStatus.SUCCEEDED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    mockClient.getMotorCommandStatus
      .mockResolvedValueOnce({ command: queuedCommand } as never)
      .mockResolvedValueOnce({ command: executingCommand } as never)
      .mockResolvedValueOnce({ command: succeededCommand } as never);

    const result = await pollMotorCommandStatus("cmd-poll", {
      intervalMs: 1,
      maxTimeoutMs: 10000,
    });

    expect(mockClient.getMotorCommandStatus).toHaveBeenCalledTimes(3);
    expect(result.command.status).toBe(MotorCommandStatus.SUCCEEDED);
    expect(result.isTerminal).toBe(true);
    expect(result.timedOut).toBe(false);
  });

  it("returns timeout flag when max duration exceeded", async () => {
    const queuedCommand = {
      commandId: "cmd-timeout",
      status: MotorCommandStatus.QUEUED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    mockClient.getMotorCommandStatus.mockResolvedValue({
      command: queuedCommand,
    } as never);

    const result = await pollMotorCommandStatus("cmd-timeout", {
      intervalMs: 10,
      maxTimeoutMs: 30,
    });

    expect(result.isTerminal).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(result.command.status).toBe(MotorCommandStatus.QUEUED);
  });

  it("invokes onStatusChange callback when status transitions", async () => {
    const onStatusChange = jest.fn();

    const queuedCommand = {
      commandId: "cmd-transition",
      status: MotorCommandStatus.QUEUED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    const executingCommand = {
      commandId: "cmd-transition",
      status: MotorCommandStatus.EXECUTING,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    const succeededCommand = {
      commandId: "cmd-transition",
      status: MotorCommandStatus.SUCCEEDED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    mockClient.getMotorCommandStatus
      .mockResolvedValueOnce({ command: queuedCommand } as never)
      .mockResolvedValueOnce({ command: executingCommand } as never)
      .mockResolvedValueOnce({ command: succeededCommand } as never);

    const result = await pollMotorCommandStatus("cmd-transition", {
      intervalMs: 1,
      maxTimeoutMs: 10000,
      onStatusChange,
    });

    expect(onStatusChange).toHaveBeenCalledTimes(3);
    expect(onStatusChange).toHaveBeenNthCalledWith(
      1,
      MotorCommandStatus.QUEUED,
      queuedCommand,
    );
    expect(onStatusChange).toHaveBeenNthCalledWith(
      2,
      MotorCommandStatus.EXECUTING,
      executingCommand,
    );
    expect(onStatusChange).toHaveBeenNthCalledWith(
      3,
      MotorCommandStatus.SUCCEEDED,
      succeededCommand,
    );
  });

  it("does not call onStatusChange on duplicate status", async () => {
    const onStatusChange = jest.fn();

    const queuedCommand = {
      commandId: "cmd-dup",
      status: MotorCommandStatus.QUEUED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    const succeededCommand = {
      commandId: "cmd-dup",
      status: MotorCommandStatus.SUCCEEDED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    mockClient.getMotorCommandStatus
      .mockResolvedValueOnce({ command: queuedCommand } as never)
      .mockResolvedValueOnce({ command: queuedCommand } as never)
      .mockResolvedValueOnce({ command: succeededCommand } as never);

    const result = await pollMotorCommandStatus("cmd-dup", {
      intervalMs: 1,
      maxTimeoutMs: 10000,
      onStatusChange,
    });

    expect(onStatusChange).toHaveBeenCalledTimes(2);
    expect(onStatusChange).toHaveBeenNthCalledWith(
      1,
      MotorCommandStatus.QUEUED,
      queuedCommand,
    );
    expect(onStatusChange).toHaveBeenNthCalledWith(
      2,
      MotorCommandStatus.SUCCEEDED,
      succeededCommand,
    );
  });

  it("throws error and stops polling on network failure", async () => {
    mockClient.getMotorCommandStatus.mockRejectedValue(
      new ConnectError("network error", Code.Unavailable),
    );

    const resultPromise = pollMotorCommandStatus("cmd-error", {
      intervalMs: 10,
      maxTimeoutMs: 5000,
    });

    await expect(resultPromise).rejects.toThrow();
  });

  it("respects custom intervalMs", async () => {
    const queuedCommand = {
      commandId: "cmd-interval",
      status: MotorCommandStatus.QUEUED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    const succeededCommand = {
      commandId: "cmd-interval",
      status: MotorCommandStatus.SUCCEEDED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    mockClient.getMotorCommandStatus
      .mockResolvedValueOnce({ command: queuedCommand } as never)
      .mockResolvedValueOnce({ command: succeededCommand } as never);

    const result = await pollMotorCommandStatus("cmd-interval", {
      intervalMs: 1,
      maxTimeoutMs: 10000,
    });

    expect(result.isTerminal).toBe(true);
    expect(mockClient.getMotorCommandStatus).toHaveBeenCalledTimes(2);
  });

  it("uses default values when options not provided", async () => {
    const succeededCommand = {
      commandId: "cmd-defaults",
      status: MotorCommandStatus.SUCCEEDED,
      reasonCode: MotorCommandReasonCode.NONE,
    } as MotorCommand;

    mockClient.getMotorCommandStatus.mockResolvedValue({
      command: succeededCommand,
    } as never);

    const result = await pollMotorCommandStatus("cmd-defaults");

    expect(result.isTerminal).toBe(true);
    expect(mockClient.getMotorCommandStatus).toHaveBeenCalled();
  });
});
