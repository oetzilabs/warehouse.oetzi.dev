import { Schema } from "effect";

export class AddressNotFound extends Schema.TaggedError<AddressNotFound>()("AddressNotFound", {
  id: Schema.String,
}) {}

export class AddressInvalidId extends Schema.TaggedError<AddressInvalidId>()("AddressInvalidId", {
  id: Schema.String,
}) {}

export class AddressNotCreated extends Schema.TaggedError<AddressNotCreated>()("AddressNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class AddressNotUpdated extends Schema.TaggedError<AddressNotUpdated>()("AddressNotUpdated", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class AddressNotDeleted extends Schema.TaggedError<AddressNotDeleted>()("AddressNotDeleted", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}
