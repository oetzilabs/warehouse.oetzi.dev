import { Schema } from "effect";

export class DocumentNotFound extends Schema.TaggedError<DocumentNotFound>()("DocumentNotFound", {
  id: Schema.String,
}) {}

export class DocumentInvalidId extends Schema.TaggedError<DocumentInvalidId>()("DocumentInvalidId", {
  id: Schema.String,
}) {}

export class DocumentNotCreated extends Schema.TaggedError<DocumentNotCreated>()("DocumentNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class DocumentNotUpdated extends Schema.TaggedError<DocumentNotUpdated>()("DocumentNotUpdated", {
  id: Schema.String,
}) {}

export class DocumentNotDeleted extends Schema.TaggedError<DocumentNotDeleted>()("DocumentNotDeleted", {
  id: Schema.String,
}) {}

export class DocumentUserLinkFailed extends Schema.TaggedError<DocumentUserLinkFailed>()("DocumentUserLinkFailed", {
  userId: Schema.String,
  documentId: Schema.String,
}) {}

export class DocumentUserInvalidId extends Schema.TaggedError<DocumentUserInvalidId>()("DocumentUserInvalidId", {
  userId: Schema.String,
}) {}
