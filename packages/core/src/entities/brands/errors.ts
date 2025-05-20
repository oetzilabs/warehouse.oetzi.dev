import { Schema } from "effect";

export class BrandNotFound extends Schema.TaggedError<BrandNotFound>()("BrandNotFound", {
  id: Schema.String,
}) {}

export class BrandInvalidId extends Schema.TaggedError<BrandInvalidId>()("BrandInvalidId", {
  id: Schema.String,
}) {}

export class BrandNotCreated extends Schema.TaggedError<BrandNotCreated>()("BrandNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class BrandNotUpdated extends Schema.TaggedError<BrandNotUpdated>()("BrandNotUpdated", {
  id: Schema.String,
}) {}

export class BrandNotDeleted extends Schema.TaggedError<BrandNotDeleted>()("BrandNotDeleted", {
  id: Schema.String,
}) {}
