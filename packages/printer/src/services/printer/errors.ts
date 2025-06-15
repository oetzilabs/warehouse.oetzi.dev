import { Schema } from "effect";

export class PrinterNotFound extends Schema.TaggedError<PrinterNotFound>()("PrinterNotFound", {
  message: Schema.optional(Schema.String),
}) {}

export class PrinterNotConnected extends Schema.TaggedError<PrinterNotConnected>()("PrinterNotConnected", {
  message: Schema.optional(Schema.String),
}) {}

export class PrintOperationError extends Schema.TaggedError<PrintOperationError>()("PrintOperationError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Any),
}) {}
