import { Schema } from "effect";

export class MessageNodeMailerError extends Schema.TaggedError<MessageNodeMailerError>()("MessageNodeMailerError", {
  cause: Schema.Unknown,
}) {}

export class MessageTemplateNotLoaded extends Schema.TaggedError<MessageTemplateNotLoaded>()(
  "MessageTemplateNotLoaded",
  {
    cause: Schema.Unknown,
    template: Schema.String,
  },
) {}

export class MessageTemplateNotFound extends Schema.TaggedError<MessageTemplateNotFound>()("MessageTemplateNotFound", {
  cause: Schema.Unknown,
  template: Schema.String,
  path: Schema.String,
}) {}

export class MessageNodeMailerSendError extends Schema.TaggedError<MessageNodeMailerSendError>()(
  "MessageNodeMailerSendError",
  {
    cause: Schema.Unknown,
  },
) {}
