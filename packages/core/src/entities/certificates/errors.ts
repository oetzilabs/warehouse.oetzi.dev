import { Schema } from "effect";

export class CertificateNotFound extends Schema.TaggedError<CertificateNotFound>()("CertificateNotFound", {
  id: Schema.String,
}) {}

export class CertificateInvalidId extends Schema.TaggedError<CertificateInvalidId>()("CertificateInvalidId", {
  id: Schema.String,
}) {}

export class CertificateNotCreated extends Schema.TaggedError<CertificateNotCreated>()("CertificateNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class CertificateNotUpdated extends Schema.TaggedError<CertificateNotUpdated>()("CertificateNotUpdated", {
  id: Schema.String,
}) {}

export class CertificateNotDeleted extends Schema.TaggedError<CertificateNotDeleted>()("CertificateNotDeleted", {
  id: Schema.String,
}) {}
