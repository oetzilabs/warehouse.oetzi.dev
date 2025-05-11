import { Schema } from "effect";

export class ProductNotFound extends Schema.TaggedError<ProductNotFound>()("ProductNotFound", {
  id: Schema.String,
}) {}

export class ProductInvalidId extends Schema.TaggedError<ProductInvalidId>()("ProductInvalidId", {
  id: Schema.String,
}) {}

export class ProductNotCreated extends Schema.TaggedError<ProductNotCreated>()("ProductNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class ProductNotUpdated extends Schema.TaggedError<ProductNotUpdated>()("ProductNotUpdated", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class ProductNotDeleted extends Schema.TaggedError<ProductNotDeleted>()("ProductNotDeleted", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}
