import { Schema } from "effect";

export class OrderNotFound extends Schema.TaggedError<OrderNotFound>()("OrderNotFound", {
  id: Schema.String,
}) {}

export class OrderInvalidId extends Schema.TaggedError<OrderInvalidId>()("OrderInvalidId", {
  id: Schema.String,
}) {}

export class OrderNotCreated extends Schema.TaggedError<OrderNotCreated>()("OrderNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class OrderNotUpdated extends Schema.TaggedError<OrderNotUpdated>()("OrderNotUpdated", {
  id: Schema.String,
}) {}

export class OrderNotDeleted extends Schema.TaggedError<OrderNotDeleted>()("OrderNotDeleted", {
  id: Schema.String,
}) {}

export class OrderUserInvalidId extends Schema.TaggedError<OrderUserInvalidId>()("OrderUserInvalidId", {
  userId: Schema.String,
}) {}

export class OrderWarehouseInvalidId extends Schema.TaggedError<OrderWarehouseInvalidId>()("OrderWarehouseInvalidId", {
  warehouseId: Schema.String,
}) {}
