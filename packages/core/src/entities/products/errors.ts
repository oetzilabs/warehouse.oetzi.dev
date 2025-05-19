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
