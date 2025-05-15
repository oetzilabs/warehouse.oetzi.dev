import { Schema } from "effect";

export class AreaNotFound extends Schema.TaggedError<AreaNotFound>()("AreaNotFound", {
  id: Schema.String,
}) {}

export class AreaInvalidId extends Schema.TaggedError<AreaInvalidId>()("AreaInvalidId", {
  id: Schema.String,
}) {}

export class AreaNotCreated extends Schema.TaggedError<AreaNotCreated>()("AreaNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class AreaNotUpdated extends Schema.TaggedError<AreaNotUpdated>()("AreaNotUpdated", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class AreaNotDeleted extends Schema.TaggedError<AreaNotDeleted>()("AreaNotDeleted", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}
