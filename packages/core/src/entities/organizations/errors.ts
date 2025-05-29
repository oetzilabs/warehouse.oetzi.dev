import { Schema } from "effect";

export class OrganizationNotFound extends Schema.TaggedError<OrganizationNotFound>()("OrganizationNotFound", {
  id: Schema.String,
}) {}

export class OrganizationInvalidId extends Schema.TaggedError<OrganizationInvalidId>()("OrganizationInvalidId", {
  id: Schema.String,
}) {}

export class OrganizationAlreadyExists extends Schema.TaggedError<OrganizationAlreadyExists>()(
  "OrganizationAlreadyExists",
  {
    name: Schema.String,
    slug: Schema.String,
  },
) {}

export class OrganizationNotUpdated extends Schema.TaggedError<OrganizationNotUpdated>()("OrganizationNotUpdated", {
  id: Schema.String,
}) {}

export class OrganizationNotDeleted extends Schema.TaggedError<OrganizationNotDeleted>()("OrganizationNotDeleted", {
  id: Schema.String,
}) {}

export class OrganizationUserInvalidId extends Schema.TaggedError<OrganizationUserInvalidId>()(
  "OrganizationUserInvalidId",
  {
    userId: Schema.String,
  },
) {}

export class OrganizationUserNotFound extends Schema.TaggedError<OrganizationUserNotFound>()(
  "OrganizationUserNotFound",
  {
    userId: Schema.String,
  },
) {}

export class OrganizationUserAlreadyExists extends Schema.TaggedError<OrganizationUserAlreadyExists>()(
  "OrganizationUserAlreadyExists",
  {
    userId: Schema.String,
    organizationId: Schema.String,
  },
) {}

export class OrganizationUserAddFailed extends Schema.TaggedError<OrganizationUserAddFailed>()(
  "OrganizationUserAddFailed",
  {
    userId: Schema.String,
    organizationId: Schema.String,
  },
) {}

export class OrganizationUserRemoveFailed extends Schema.TaggedError<OrganizationUserRemoveFailed>()(
  "OrganizationUserRemoveFailed",
  {
    userId: Schema.String,
    organizationId: Schema.String,
  },
) {}

export class OrganizationTaxRateNotFound extends Schema.TaggedError<OrganizationTaxRateNotFound>()(
  "OrganizationTaxRateNotFound",
  {
    id: Schema.String,
  },
) {}
