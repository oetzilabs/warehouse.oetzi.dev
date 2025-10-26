import { Schema } from "effect";

export class PrinterNotFound extends Schema.TaggedError<PrinterNotFound>()("PrinterNotFound", {
  message: Schema.optional(Schema.String),
}) {}

export class PrinterNotConnected extends Schema.TaggedError<PrinterNotConnected>()("PrinterNotConnected", {
  message: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class PrintOperationError extends Schema.TaggedError<PrintOperationError>()("PrintOperationError", {
  message: Schema.String,
  operation: Schema.String,
  value: Schema.optional(Schema.Any),
  cause: Schema.optional(Schema.Any),
}) {}
