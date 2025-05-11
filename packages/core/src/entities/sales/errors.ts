import { Schema } from "effect";

export class SaleNotFound extends Schema.TaggedError<SaleNotFound>()("SaleNotFound", {
  id: Schema.String,
}) {}

export class SaleInvalidId extends Schema.TaggedError<SaleInvalidId>()("SaleInvalidId", {
  id: Schema.String,
}) {}

export class SaleNotCreated extends Schema.TaggedError<SaleNotCreated>()("SaleNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class SaleNotUpdated extends Schema.TaggedError<SaleNotUpdated>()("SaleNotUpdated", {
  id: Schema.String,
}) {}

export class SaleNotDeleted extends Schema.TaggedError<SaleNotDeleted>()("SaleNotDeleted", {
  id: Schema.String,
}) {}

export class SaleWarehouseNotFound extends Schema.TaggedError<SaleWarehouseNotFound>()("SaleWarehouseNotFound", {
  warehouseId: Schema.String,
}) {}
