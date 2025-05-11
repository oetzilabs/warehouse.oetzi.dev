import { Schema } from "effect";

export class SessionNotFound extends Schema.TaggedError<SessionNotFound>()("SessionNotFound", {
  id: Schema.String,
}) {}

export class SessionInvalidId extends Schema.TaggedError<SessionInvalidId>()("SessionInvalidId", {
  id: Schema.String,
}) {}

export class SessionTokenNotFound extends Schema.TaggedError<SessionTokenNotFound>()("SessionTokenNotFound", {
  token: Schema.String,
}) {}

export class SessionNotCreated extends Schema.TaggedError<SessionNotCreated>()("SessionNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class SessionNotUpdated extends Schema.TaggedError<SessionNotUpdated>()("SessionNotUpdated", {
  id: Schema.String,
}) {}

export class SessionNotDeleted extends Schema.TaggedError<SessionNotDeleted>()("SessionNotDeleted", {
  id: Schema.String,
}) {}
