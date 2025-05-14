import { Schema } from "effect";

export class FacilityNotFound extends Schema.TaggedError<FacilityNotFound>()("FacilityNotFound", {
  id: Schema.String,
}) {}

export class FacilityInvalidId extends Schema.TaggedError<FacilityInvalidId>()("FacilityInvalidId", {
  id: Schema.String,
}) {}

export class FacilityNotCreated extends Schema.TaggedError<FacilityNotCreated>()("FacilityNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class FacilityNotUpdated extends Schema.TaggedError<FacilityNotUpdated>()("FacilityNotUpdated", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class FacilityNotDeleted extends Schema.TaggedError<FacilityNotDeleted>()("FacilityNotDeleted", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}
