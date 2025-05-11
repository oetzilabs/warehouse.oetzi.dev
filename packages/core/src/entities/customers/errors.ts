import { Schema } from "effect";

export class CustomerNotFound extends Schema.TaggedError<CustomerNotFound>()("CustomerNotFound", {
  id: Schema.String,
}) {}

export class CustomerInvalidId extends Schema.TaggedError<CustomerInvalidId>()("CustomerInvalidId", {
  id: Schema.String,
}) {}

export class CustomerNotCreated extends Schema.TaggedError<CustomerNotCreated>()("CustomerNotCreated", {
  message: Schema.optional(Schema.String),
}) {}
