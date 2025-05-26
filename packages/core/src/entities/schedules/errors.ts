import { Schema } from "effect";

export class ScheduleNotFound extends Schema.TaggedError<ScheduleNotFound>()("ScheduleNotFound", {
  id: Schema.String,
}) {}

export class ScheduleInvalidId extends Schema.TaggedError<ScheduleInvalidId>()("ScheduleInvalidId", {
  id: Schema.String,
}) {}

export class ScheduleNotCreated extends Schema.TaggedError<ScheduleNotCreated>()("ScheduleNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class ScheduleNotUpdated extends Schema.TaggedError<ScheduleNotUpdated>()("ScheduleNotUpdated", {
  id: Schema.String,
}) {}

export class ScheduleNotDeleted extends Schema.TaggedError<ScheduleNotDeleted>()("ScheduleNotDeleted", {
  id: Schema.String,
}) {}
