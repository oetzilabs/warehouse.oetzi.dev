import { Schema } from "effect";

export class InventoryNotFound extends Schema.TaggedError<InventoryNotFound>()("InventoryNotFound", {
  id: Schema.String,
}) {}

export class InventoryNotCreated extends Schema.TaggedError<InventoryNotCreated>()("InventoryNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class InventoryInvalidId extends Schema.TaggedError<InventoryInvalidId>()("InventoryInvalidId", {
  id: Schema.String,
}) {}
