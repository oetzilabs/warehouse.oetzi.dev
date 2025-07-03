import { Schema } from "effect";

export class UserNotFound extends Schema.TaggedError<UserNotFound>()("UserNotFound", {
  id: Schema.String,
}) {}

export class UserNotFoundViaEmail extends Schema.TaggedError<UserNotFoundViaEmail>()("UserNotFoundViaEmail", {
  email: Schema.String,
}) {}

export class UserInvalidId extends Schema.TaggedError<UserInvalidId>()("UserInvalidId", {
  id: Schema.String,
}) {}

export class UserNotCreated extends Schema.TaggedError<UserNotCreated>()("UserNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class UserInvalidEmail extends Schema.TaggedError<UserInvalidEmail>()("UserInvalidEmail", {
  email: Schema.String,
}) {}

export class UserPasswordRequired extends Schema.TaggedError<UserPasswordRequired>()("UserPasswordRequired", {}) {}

export class UserAuthenticationFailed extends Schema.TaggedError<UserAuthenticationFailed>()(
  "UserAuthenticationFailed",
  {
    email: Schema.String,
  },
) {}

export class UserNotUpdated extends Schema.TaggedError<UserNotUpdated>()("UserNotUpdated", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class UserNotDeleted extends Schema.TaggedError<UserNotDeleted>()("UserNotDeleted", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class UserDisableFailed extends Schema.TaggedError<UserDisableFailed>()("UserDisableFailed", {
  id: Schema.String,
}) {}

export class UserLastOrgNotFound extends Schema.TaggedError<UserLastOrgNotFound>()("UserLastOrgNotFound", {
  userId: Schema.String,
}) {}

export class UserLastWarehouseNotFound extends Schema.TaggedError<UserLastWarehouseNotFound>()(
  "UserLastWarehouseNotFound",
  {
    userId: Schema.String,
  },
) {}

export class UserLastFacilityNotFound extends Schema.TaggedError<UserLastFacilityNotFound>()(
  "UserLastFacilityNotFound",
  {
    userId: Schema.String,
  },
) {}
