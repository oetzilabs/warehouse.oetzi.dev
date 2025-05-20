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

export class ProductLabelInvalidId extends Schema.TaggedError<ProductLabelInvalidId>()("ProductLabelInvalidId", {
  id: Schema.String,
}) {}

export class ProductLabelNotFound extends Schema.TaggedError<ProductLabelNotFound>()("ProductLabelNotFound", {
  id: Schema.String,
}) {}

export class ProductLabelAlreadyExists extends Schema.TaggedError<ProductLabelAlreadyExists>()(
  "ProductLabelAlreadyExists",
  {
    id: Schema.String,
  },
) {}

export class ProductLabelNotAdded extends Schema.TaggedError<ProductLabelNotAdded>()("ProductLabelNotAdded", {}) {}

export class ProductLabelNotCreated extends Schema.TaggedError<ProductLabelNotCreated>()("ProductLabelNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class ProductLabelNotUpdated extends Schema.TaggedError<ProductLabelNotUpdated>()("ProductLabelNotUpdated", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class ProductLabelNotDeleted extends Schema.TaggedError<ProductLabelNotDeleted>()("ProductLabelNotDeleted", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class ProductInvalidJson extends Schema.TaggedError<ProductInvalidJson>()("ProductInvalidJson", {
  json: Schema.Unknown,
  issues: Schema.Any,
}) {}
