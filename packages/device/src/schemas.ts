import { Schema } from "effect";

export const DeviceConfigSchema = Schema.Struct({
  deviceId: Schema.String,
  token: Schema.String,
  createdAt: Schema.String,
  brokerUrl: Schema.String,
  topic: Schema.String,
});

export type DeviceConfig = typeof DeviceConfigSchema.Type;
