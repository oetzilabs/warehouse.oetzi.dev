import { Schema } from "effect";

export class DaemonError extends Schema.TaggedError<DaemonError>()("DaemonError", {
  message: Schema.String,
}) {}

export class DaemonAlreadyRunning extends Schema.TaggedError<DaemonAlreadyRunning>()("DaemonAlreadyRunning", {
  pid: Schema.Number,
}) {}

export class DaemonNotRunning extends Schema.TaggedError<DaemonNotRunning>()("DaemonNotRunning", {
  message: Schema.String,
}) {}