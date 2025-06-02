import { Schema } from "effect";

export class PDFGenerationError extends Schema.TaggedError<PDFGenerationError>()("PDFGenerationError", {
  message: Schema.String,
}) {}
