import { Schema } from "effect";

export class MessageNotFound extends Schema.TaggedError<MessageNotFound>()("MessageNotFound", {
  id: Schema.String,
}) {}

export class MessageInvalidId extends Schema.TaggedError<MessageInvalidId>()("MessageInvalidId", {
  id: Schema.String,
}) {}

export class MessageNotCreated extends Schema.TaggedError<MessageNotCreated>()("MessageNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class MessageNotUpdated extends Schema.TaggedError<MessageNotUpdated>()("MessageNotUpdated", {
  id: Schema.String,
}) {}

export class MessageNotDeleted extends Schema.TaggedError<MessageNotDeleted>()("MessageNotDeleted", {
  id: Schema.String,
}) {}

export class MessageUserInvalidId extends Schema.TaggedError<MessageUserInvalidId>()("MessageUserInvalidId", {
  userId: Schema.String,
}) {}
