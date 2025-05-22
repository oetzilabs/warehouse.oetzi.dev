import { Schema } from "effect";

export class DeviceNotFound extends Schema.TaggedError<DeviceNotFound>()("DeviceNotFound", {
  id: Schema.String,
}) {}

export class DeviceInvalidId extends Schema.TaggedError<DeviceInvalidId>()("DeviceInvalidId", {
  id: Schema.String,
}) {}

export class DeviceNotCreated extends Schema.TaggedError<DeviceNotCreated>()("DeviceNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class DeviceNotUpdated extends Schema.TaggedError<DeviceNotUpdated>()("DeviceNotUpdated", {
  id: Schema.String,
}) {}

export class DeviceNotDeleted extends Schema.TaggedError<DeviceNotDeleted>()("DeviceNotDeleted", {
  id: Schema.String,
}) {}

export class DeviceWarehouseInvalidId extends Schema.TaggedError<DeviceWarehouseInvalidId>()(
  "DeviceWarehouseInvalidId",
  {
    warehouseId: Schema.String,
  },
) {}

export class DeviceNotPrinter extends Schema.TaggedError<DeviceNotPrinter>()("DeviceNotPrinter", {
  id: Schema.String,
}) {}

export class DeviceNotOnline extends Schema.TaggedError<DeviceNotOnline>()("DeviceNotOnline", {
  id: Schema.String,
}) {}

export class DeviceNotOffline extends Schema.TaggedError<DeviceNotOffline>()("DeviceNotOffline", {
  id: Schema.String,
}) {}

export class DeviceAlreadyOnline extends Schema.TaggedError<DeviceAlreadyOnline>()("DeviceAlreadyOnline", {
  id: Schema.String,
}) {}
