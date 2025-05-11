import { Schema } from "effect";

export class PaymentMethodNotFound extends Schema.TaggedError<PaymentMethodNotFound>()("PaymentMethodNotFound", {
  id: Schema.String,
}) {}

export class PaymentMethodInvalidId extends Schema.TaggedError<PaymentMethodInvalidId>()("PaymentMethodInvalidId", {
  id: Schema.String,
}) {}

export class PaymentMethodNotCreated extends Schema.TaggedError<PaymentMethodNotCreated>()("PaymentMethodNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class PaymentMethodNotUpdated extends Schema.TaggedError<PaymentMethodNotUpdated>()("PaymentMethodNotUpdated", {
  id: Schema.String,
}) {}

export class PaymentMethodNotDeleted extends Schema.TaggedError<PaymentMethodNotDeleted>()("PaymentMethodNotDeleted", {
  id: Schema.String,
}) {}
