import { gardenClient } from "./api";
import type {
  InsertSensorDataResponse,
  SensorSummary,
} from "@harvesthub-gardening-tool/protos-typescript/garden/v1/garden_pb";

export async function insertSensorData(data: {
  nodeId: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  timestamp: bigint;
}): Promise<InsertSensorDataResponse> {
  return gardenClient.insertSensorData(data);
}

export async function getSummary(
  nodeId?: string,
  hours?: number,
): Promise<SensorSummary[]> {
  const res = await gardenClient.getSummary({ nodeId, hours });
  return res.summaries;
}
