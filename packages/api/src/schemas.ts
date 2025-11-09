import { Schema } from "effect";

// Schemas
export const DeviceConfig = Schema.Struct({
  deviceId: Schema.String,
  token: Schema.String,
  name: Schema.String,
  type: Schema.String,
  orgId: Schema.String,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
});

export const DeviceType = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  deletedAt: Schema.optional(Schema.DateTimeUtc),
});

export const Organization = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export const DeviceSetupRequest = Schema.Struct({
  type: Schema.String,
  name: Schema.String,
  orgId: Schema.String,
  deviceId: Schema.String,
});

export const DeviceConnectRequest = Schema.Struct({
  deviceId: Schema.String,
  token: Schema.String,
});

export const DeviceStatusResponse = Schema.Struct({
  status: Schema.Literal("banned", "ok", "unknown"),
});

// Export types for external use
export type DeviceConfig = Schema.Schema.Type<typeof DeviceConfig>;
export type DeviceType = Schema.Schema.Type<typeof DeviceType>;
export type Organization = Schema.Schema.Type<typeof Organization>;
export type DeviceSetupRequest = Schema.Schema.Type<typeof DeviceSetupRequest>;
export type DeviceConnectRequest = Schema.Schema.Type<typeof DeviceConnectRequest>;
export type DeviceStatusResponse = Schema.Schema.Type<typeof DeviceStatusResponse>;
