import { Schema } from "effect";

export class MQTTConnectionError extends Schema.TaggedError<MQTTConnectionError>()("MQTTConnectionError", {
  message: Schema.String,
}) {}

export class MQTTPublishError extends Schema.TaggedError<MQTTPublishError>()("MQTTPublishError", {
  message: Schema.String,
}) {}

export class MQTTSubscribeError extends Schema.TaggedError<MQTTSubscribeError>()("MQTTSubscribeError", {
  message: Schema.String,
}) {}
