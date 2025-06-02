import { Schema } from "effect";

export class SupplierNotFound extends Schema.TaggedError<SupplierNotFound>()("SupplierNotFound", {
  id: Schema.String,
}) {}

export class SupplierInvalidId extends Schema.TaggedError<SupplierInvalidId>()("SupplierInvalidId", {
  id: Schema.String,
}) {}

export class SupplierNotCreated extends Schema.TaggedError<SupplierNotCreated>()("SupplierNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class SupplierContactNotCreated extends Schema.TaggedError<SupplierContactNotCreated>()(
  "SupplierContactNotCreated",
  {
    supplierId: Schema.String,
  },
) {}

export class SupplierNoteNotCreated extends Schema.TaggedError<SupplierNoteNotCreated>()("SupplierNoteNotCreated", {
  supplierId: Schema.String,
}) {}

export class SupplierNotDeleted extends Schema.TaggedError<SupplierNotDeleted>()("SupplierNotDeleted", {
  id: Schema.String,
}) {}

export class SupplierNotUpdated extends Schema.TaggedError<SupplierNotUpdated>()("SupplierNotUpdated", {
  id: Schema.String,
}) {}

export class SupplierOrganizationInvalidId extends Schema.TaggedError<SupplierOrganizationInvalidId>()(
  "SupplierOrganizationInvalidId",
  {
    organizationId: Schema.String,
  },
) {}

export class SupplierOrganizationLinkFailed extends Schema.TaggedError<SupplierOrganizationLinkFailed>()(
  "SupplierOrganizationLinkFailed",
  {
    organizationId: Schema.String,
    supplierId: Schema.String,
  },
) {}

export class SupplierOrganizationUnlinkFailed extends Schema.TaggedError<SupplierOrganizationUnlinkFailed>()(
  "SupplierOrganizationUnlinkFailed",
  {
    organizationId: Schema.String,
    supplierId: Schema.String,
  },
) {}

export class SupplierNoteNotFound extends Schema.TaggedError<SupplierNoteNotFound>()("SupplierNoteNotFound", {
  id: Schema.String,
}) {}

export class SupplierNoteNotUpdated extends Schema.TaggedError<SupplierNoteNotUpdated>()("SupplierNoteNotUpdated", {
  id: Schema.String,
}) {}

export class SupplierNoteNotDeleted extends Schema.TaggedError<SupplierNoteNotDeleted>()("SupplierNoteNotDeleted", {
  id: Schema.String,
}) {}
