import { Schema } from "effect";

export class WarehouseNotFound extends Schema.TaggedError<WarehouseNotFound>()("WarehouseNotFound", {
  id: Schema.String,
}) {}

export class WarehouseInvalidId extends Schema.TaggedError<WarehouseInvalidId>()("WarehouseInvalidId", {
  id: Schema.String,
}) {}

export class WarehouseNotCreated extends Schema.TaggedError<WarehouseNotCreated>()("WarehouseNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class WarehouseNotUpdated extends Schema.TaggedError<WarehouseNotUpdated>()("WarehouseNotUpdated", {
  id: Schema.String,
}) {}

export class WarehouseNotDeleted extends Schema.TaggedError<WarehouseNotDeleted>()("WarehouseNotDeleted", {
  id: Schema.String,
}) {}

export class WarehouseAreaNotFound extends Schema.TaggedError<WarehouseAreaNotFound>()("WarehouseAreaNotFound", {
  id: Schema.String,
}) {}

export class WarehouseOrganizationLinkFailed extends Schema.TaggedError<WarehouseOrganizationLinkFailed>()(
  "WarehouseOrganizationLinkFailed",
  {
    organizationId: Schema.String,
    warehouseId: Schema.String,
  },
) {}

export class WarehouseOrganizationUnlinkFailed extends Schema.TaggedError<WarehouseOrganizationUnlinkFailed>()(
  "WarehouseOrganizationUnlinkFailed",
  {
    organizationId: Schema.String,
    warehouseId: Schema.String,
  },
) {}

export class WarehouseUserLinkFailed extends Schema.TaggedError<WarehouseUserLinkFailed>()("WarehouseUserLinkFailed", {
  userId: Schema.String,
  warehouseId: Schema.String,
}) {}

export class WarehouseOrganizationInvalidId extends Schema.TaggedError<WarehouseOrganizationInvalidId>()(
  "WarehouseOrganizationInvalidId",
  {
    organizationId: Schema.String,
  },
) {}

export class WarehouseUserInvalidId extends Schema.TaggedError<WarehouseUserInvalidId>()("WarehouseUserInvalidId", {
  userId: Schema.String,
}) {}

export class WarehouseNotFoundForOrganization extends Schema.TaggedError<WarehouseNotFoundForOrganization>()(
  "WarehouseNotFoundForOrganization",
  {
    organizationId: Schema.String,
  },
) {}
