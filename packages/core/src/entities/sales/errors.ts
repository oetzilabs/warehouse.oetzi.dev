import { Schema } from "effect";

export class SaleNotFound extends Schema.TaggedError<SaleNotFound>()("SaleNotFound", {
  id: Schema.String,
}) {}

export class SaleInvalidId extends Schema.TaggedError<SaleInvalidId>()("SaleInvalidId", {
  id: Schema.String,
}) {}

export class SaleNotCreated extends Schema.TaggedError<SaleNotCreated>()("SaleNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class SaleNotUpdated extends Schema.TaggedError<SaleNotUpdated>()("SaleNotUpdated", {
  id: Schema.String,
}) {}

export class SaleNotDeleted extends Schema.TaggedError<SaleNotDeleted>()("SaleNotDeleted", {
  id: Schema.String,
}) {}

export class SaleOrganizationNotFound extends Schema.TaggedError<SaleOrganizationNotFound>()(
  "SaleOrganizationNotFound",
  {
    orgId: Schema.String,
  },
) {}

export class SaleConversionFailed extends Schema.TaggedError<SaleConversionFailed>()("SaleConversionFailed", {
  message: Schema.optional(Schema.String),
}) {}

export class SaleProductInvalidId extends Schema.TaggedError<SaleProductInvalidId>()("SaleProductInvalidId", {
  id: Schema.String,
}) {}

export class SaleProductNotAdded extends Schema.TaggedError<SaleProductNotAdded>()("SaleProductNotAdded", {
  saleId: Schema.String,
  productId: Schema.String,
}) {}

export class SaleProductNotFound extends Schema.TaggedError<SaleProductNotFound>()("SaleProductNotFound", {
  id: Schema.String,
}) {}

export class SaleProductNotRemoved extends Schema.TaggedError<SaleProductNotRemoved>()("SaleProductNotRemoved", {
  saleId: Schema.String,
  productId: Schema.String,
}) {}

export class SaleProductNotUpdated extends Schema.TaggedError<SaleProductNotUpdated>()("SaleProductNotUpdated", {
  id: Schema.String,
}) {}
