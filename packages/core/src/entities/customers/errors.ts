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

export class CustomerNotDeleted extends Schema.TaggedError<CustomerNotDeleted>()("CustomerNotDeleted", {
  id: Schema.String,
}) {}

export class CustomerNotUpdated extends Schema.TaggedError<CustomerNotUpdated>()("CustomerNotUpdated", {
  id: Schema.String,
}) {}

export class CustomerOrganizationInvalidId extends Schema.TaggedError<CustomerOrganizationInvalidId>()(
  "CustomerOrganizationInvalidId",
  {
    organizationId: Schema.String,
  },
) {}

export class CustomerOrganizationLinkFailed extends Schema.TaggedError<CustomerOrganizationLinkFailed>()(
  "CustomerOrganizationLinkFailed",
  {
    organizationId: Schema.String,
    customerId: Schema.String,
  },
) {}

export class CustomerOrganizationUnlinkFailed extends Schema.TaggedError<CustomerOrganizationUnlinkFailed>()(
  "CustomerOrganizationUnlinkFailed",
  {
    organizationId: Schema.String,
    customerId: Schema.String,
  },
) {}

export class CustomerNoteInvalidId extends Schema.TaggedError<CustomerNoteInvalidId>()("CustomerNoteInvalidId", {
  id: Schema.String,
}) {}

export class CustomerNoteNotFound extends Schema.TaggedError<CustomerNoteNotFound>()("CustomerNoteNotFound", {
  id: Schema.String,
}) {}

export class CustomerNoteNotUpdated extends Schema.TaggedError<CustomerNoteNotUpdated>()("CustomerNoteNotUpdated", {
  id: Schema.String,
}) {}
