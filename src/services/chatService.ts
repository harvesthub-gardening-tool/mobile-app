import { Code, ConnectError } from "@connectrpc/connect";
import type { ChatPlantContext } from "@harvesthub-gardening-tool/protos-typescript/chat/v1/chat_pb";

import { chatClient } from "./api";
import type { PlacedPlant, PlacedSonde } from "@/types/garden";

function translateError(err: unknown): string {
  const connectErr = ConnectError.from(err);
  switch (connectErr.code) {
    case Code.Unauthenticated:
      return "Session expirée. Veuillez vous reconnecter.";
    case Code.PermissionDenied:
      return "Votre session ne permet pas d'utiliser le chat.";
    case Code.InvalidArgument:
      return connectErr.rawMessage || "Votre message est vide ou trop long.";
    case Code.Unavailable:
      return "L'assistant est temporairement indisponible. Réessayez plus tard.";
    default:
      return connectErr.rawMessage || "Impossible de contacter l'assistant.";
  }
}

export function buildPlantContext(plants: PlacedPlant[], sondes: PlacedSonde[]): ChatPlantContext[] {
  const nodeIdBySondeId = new Map(sondes.map((sonde) => [sonde.id, sonde.nodeId]));

  return plants.map((plant) => ({
    $typeName: "chat.v1.ChatPlantContext",
    id: plant.id,
    name: plant.plantType.name,
    quantity: plant.quantity,
    probeNodeId: plant.sondeId ? nodeIdBySondeId.get(plant.sondeId) ?? "" : "",
  }));
}

export async function sendChatMessage(params: {
  message: string;
  plants: PlacedPlant[];
  sondes: PlacedSonde[];
}): Promise<string> {
  try {
    const res = await chatClient.sendMessage({
      message: params.message,
      plants: buildPlantContext(params.plants, params.sondes),
    });
    return res.reply;
  } catch (err: unknown) {
    throw new Error(translateError(err));
  }
}
