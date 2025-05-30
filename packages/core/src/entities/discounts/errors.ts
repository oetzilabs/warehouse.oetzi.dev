import { Schema } from "effect";

export class DiscountNotFound extends Schema.TaggedError<DiscountNotFound>()("DiscountNotFound", {
  id: Schema.String,
}) {}

export class DiscountInvalidId extends Schema.TaggedError<DiscountInvalidId>()("DiscountInvalidId", {
  id: Schema.String,
}) {}

export class DiscountNotCreated extends Schema.TaggedError<DiscountNotCreated>()("DiscountNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class DiscountNotUpdated extends Schema.TaggedError<DiscountNotUpdated>()("DiscountNotUpdated", {
  id: Schema.String,
}) {}

export class DiscountNotDeleted extends Schema.TaggedError<DiscountNotDeleted>()("DiscountNotDeleted", {
  id: Schema.String,
}) {}

export class OrganizationNoDiscounts extends Schema.TaggedError<OrganizationNoDiscounts>()("OrganizationNoDiscounts", {
  id: Schema.String,
}) {}
