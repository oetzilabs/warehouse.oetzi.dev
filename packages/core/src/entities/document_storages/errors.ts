import { Schema } from "effect";

export class StorageNotFound extends Schema.TaggedError<StorageNotFound>()("StorageNotFound", {
  id: Schema.String,
}) {}

export class StorageInvalidId extends Schema.TaggedError<StorageInvalidId>()("StorageInvalidId", {
  id: Schema.String,
}) {}

export class StorageNotCreated extends Schema.TaggedError<StorageNotCreated>()("StorageNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class StorageNotUpdated extends Schema.TaggedError<StorageNotUpdated>()("StorageNotUpdated", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class StorageNotDeleted extends Schema.TaggedError<StorageNotDeleted>()("StorageNotDeleted", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class StorageOrganizationInvalidId extends Schema.TaggedError<StorageOrganizationInvalidId>()(
  "StorageOrganizationInvalidId",
  {
    organizationId: Schema.String,
  },
) {}

export class StorageOrganizationLinkFailed extends Schema.TaggedError<StorageOrganizationLinkFailed>()(
  "StorageOrganizationLinkFailed",
  {
    organizationId: Schema.String,
    storageId: Schema.String,
  },
) {}
