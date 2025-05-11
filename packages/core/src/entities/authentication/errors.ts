import { Schema } from "effect";

export class AuthNoJwtSecrets extends Schema.TaggedError<AuthNoJwtSecrets>()("AuthNoJwtSecrets", {
  message: Schema.String,
}) {}

export class AuthInvalidToken extends Schema.TaggedError<AuthInvalidToken>()("AuthInvalidToken", {
  message: Schema.optional(Schema.String),
}) {}

export class AuthSessionNotFound extends Schema.TaggedError<AuthSessionNotFound>()("AuthSessionNotFound", {
  token: Schema.String,
}) {}

export class AuthUserNotFound extends Schema.TaggedError<AuthUserNotFound>()("AuthUserNotFound", {
  userId: Schema.String,
}) {}

export class AuthLoginFailed extends Schema.TaggedError<AuthLoginFailed>()("AuthLoginFailed", {
  email: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class AuthSessionCreateFailed extends Schema.TaggedError<AuthSessionCreateFailed>()("AuthSessionCreateFailed", {
  userId: Schema.String,
}) {}

export class AuthUserAlreadyExists extends Schema.TaggedError<AuthUserAlreadyExists>()("AuthUserAlreadyExists", {
  email: Schema.String,
}) {}

export class AuthSignupFailed extends Schema.TaggedError<AuthSignupFailed>()("AuthSignupFailed", {
  email: Schema.String,
  message: Schema.optional(Schema.String),
}) {}
