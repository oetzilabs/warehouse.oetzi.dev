import { Schema } from "effect";

export class BuildCommandFailed extends Schema.TaggedError<BuildCommandFailed>()("BuildCommandFailed", {
  message: Schema.String,
  cause: Schema.Any,
}) {}
