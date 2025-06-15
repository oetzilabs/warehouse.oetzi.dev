import { Schema } from "effect";

export class RealtimePublishError extends Schema.TaggedError<RealtimePublishError>()("RealtimePublishError", {
  message: Schema.String,
  error: Schema.Any,
}) {}

export class RealtimeInvalidPayloadError extends Schema.TaggedError<RealtimeInvalidPayloadError>()(
  "RealtimeInvalidPayloadError",
  {
    message: Schema.String,
  },
) {}
