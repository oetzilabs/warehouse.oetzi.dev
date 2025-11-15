import { Schema } from "effect";

export const DeviceCapabilityType = Schema.Literal(
  "thermal-printer",
  "pdf-printer",
  "mqtt-broker",
  "mqtt-client",
  "unknown",
);
export type DeviceCapabilityType = typeof DeviceCapabilityType.Type;

export const DeviceCapability = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  type: DeviceCapabilityType,
  version: Schema.String.pipe(Schema.minLength(64)),
  fileUrl: Schema.String,
});
export type DeviceCapability = typeof DeviceCapability.Type;

export const DeviceConfigSchema = Schema.Struct({
  deviceId: Schema.String,
  token: Schema.String,
  createdAt: Schema.String,
  brokerUrl: Schema.String,
  topic: Schema.String,
  capabilities: Schema.mutable(Schema.Array(Schema.String)),
});

export type DeviceConfig = typeof DeviceConfigSchema.Type;
