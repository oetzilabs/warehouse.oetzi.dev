import { Schema } from "effect";

export class PurchaseNotFound extends Schema.TaggedError<PurchaseNotFound>()("PurchaseNotFound", {
  id: Schema.String,
}) {}

export class PurchaseInvalidId extends Schema.TaggedError<PurchaseInvalidId>()("PurchaseInvalidId", {
  id: Schema.String,
}) {}

export class PurchaseNotCreated extends Schema.TaggedError<PurchaseNotCreated>()("PurchaseNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class PurchaseNotDeleted extends Schema.TaggedError<PurchaseNotDeleted>()("PurchaseNotDeleted", {
  id: Schema.String,
}) {}

export class PurchaseNotUpdated extends Schema.TaggedError<PurchaseNotUpdated>()("PurchaseNotUpdated", {
  id: Schema.String,
}) {}

export class PurchaseUserInvalidId extends Schema.TaggedError<PurchaseUserInvalidId>()("PurchaseUserInvalidId", {
  userId: Schema.String,
}) {}

export class PurchaseOrganizationInvalidId extends Schema.TaggedError<PurchaseOrganizationInvalidId>()(
  "PurchaseOrganizationInvalidId",
  {
    organizationId: Schema.String,
  },
) {}

export class PurchaseOrganizationLinkFailed extends Schema.TaggedError<PurchaseOrganizationLinkFailed>()(
  "PurchaseOrganizationLinkFailed",
  {
    organizationId: Schema.String,
    purchaseId: Schema.String,
  },
) {}

export class PurchaseOrganizationUnlinkFailed extends Schema.TaggedError<PurchaseOrganizationUnlinkFailed>()(
  "PurchaseOrganizationUnlinkFailed",
  {
    organizationId: Schema.String,
    purchaseId: Schema.String,
  },
) {}
