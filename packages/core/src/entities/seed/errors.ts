import { Schema } from "effect";

export class SeedingFailed extends Schema.TaggedError<SeedingFailed>()("SeedingFailed", {
  message: Schema.String,
  service: Schema.String,
}) {}
