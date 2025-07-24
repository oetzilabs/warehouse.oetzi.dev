import { Schema } from "effect";

export class BinaryFileNotFound extends Schema.TaggedError<BinaryFileNotFound>()("BinaryFileNotFound", {
  path: Schema.String,
  cause: Schema.Unknown,
}) {}

export class BinaryError extends Schema.TaggedError<BinaryError>()("BinaryError", {
  cause: Schema.Unknown,
}) {}
