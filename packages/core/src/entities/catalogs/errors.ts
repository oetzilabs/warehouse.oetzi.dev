import { Schema } from "effect";

export class CatalogNotFound extends Schema.TaggedError<CatalogNotFound>()("CatalogNotFound", {
  id: Schema.String,
}) {}

export class CatalogInvalidId extends Schema.TaggedError<CatalogInvalidId>()("CatalogInvalidId", {
  id: Schema.String,
}) {}

export class CatalogNotCreated extends Schema.TaggedError<CatalogNotCreated>()("CatalogNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class CatalogNotUpdated extends Schema.TaggedError<CatalogNotUpdated>()("CatalogNotUpdated", {
  id: Schema.String,
}) {}

export class CatalogNotDeleted extends Schema.TaggedError<CatalogNotDeleted>()("CatalogNotDeleted", {
  id: Schema.String,
}) {}

export class CatalogProductNotFound extends Schema.TaggedError<CatalogProductNotFound>()("CatalogProductNotFound", {
  catalogId: Schema.String,
  productId: Schema.String,
}) {}

export class CatalogProductAlreadyExists extends Schema.TaggedError<CatalogProductAlreadyExists>()(
  "CatalogProductAlreadyExists",
  {
    catalogId: Schema.String,
    productId: Schema.String,
  },
) {}

export class CatalogOrganizationInvalidId extends Schema.TaggedError<CatalogOrganizationInvalidId>()(
  "CatalogOrganizationInvalidId",
  {
    organizationId: Schema.String,
  },
) {}
