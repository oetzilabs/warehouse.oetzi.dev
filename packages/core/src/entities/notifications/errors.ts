import { Schema } from "effect";

export class NotificationNotFound extends Schema.TaggedError<NotificationNotFound>()("NotificationNotFound", {
  id: Schema.String,
}) {}

export class NotificationInvalidId extends Schema.TaggedError<NotificationInvalidId>()("NotificationInvalidId", {
  id: Schema.String,
}) {}

export class NotificationInvalidUserId extends Schema.TaggedError<NotificationInvalidUserId>()(
  "NotificationInvalidUserId",
  {
    id: Schema.String,
  },
) {}

export class NotificationNotCreated extends Schema.TaggedError<NotificationNotCreated>()("NotificationNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class NotificationNotUpdated extends Schema.TaggedError<NotificationNotUpdated>()("NotificationNotUpdated", {
  id: Schema.String,
}) {}

export class NotificationNotDeleted extends Schema.TaggedError<NotificationNotDeleted>()("NotificationNotDeleted", {
  id: Schema.String,
}) {}

export class NotificationOrganizationInvalidId extends Schema.TaggedError<NotificationOrganizationInvalidId>()(
  "NotificationOrganizationInvalidId",
  {
    organizationId: Schema.String,
  },
) {}

export class NotificationOrganizationLinkFailed extends Schema.TaggedError<NotificationOrganizationLinkFailed>()(
  "NotificationOrganizationLinkFailed",
  {
    organizationId: Schema.String,
    notificationId: Schema.String,
  },
) {}
