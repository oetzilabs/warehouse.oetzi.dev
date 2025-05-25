import { Schema } from "effect";

export class SnapshotNotFound extends Schema.TaggedError<SnapshotNotFound>()("SnapshotNotFound", {
  id: Schema.String,
}) {}

export class SnapshotNotImplemented extends Schema.TaggedError<SnapshotNotImplemented>()("SnapshotNotImplemented", {
  id: Schema.String,
}) {}

export class SnapshotInvalidType extends Schema.TaggedError<SnapshotInvalidType>()("SnapshotInvalidType", {
  id: Schema.String,
  type: Schema.String,
}) {}

export class SnapshotCreationFailed extends Schema.TaggedError<SnapshotCreationFailed>()("SnapshotCreationFailed", {
  message: Schema.optional(Schema.String),
}) {}

export class SnapshotRestoreFailed extends Schema.TaggedError<SnapshotRestoreFailed>()("SnapshotRestoreFailed", {
  id: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class SnapshotInvalidId extends Schema.TaggedError<SnapshotInvalidId>()("SnapshotInvalidId", {
  id: Schema.String,
}) {}

export class SnapshotDeletionFailed extends Schema.TaggedError<SnapshotDeletionFailed>()("SnapshotDeletionFailed", {
  id: Schema.String,
}) {}

export class SnapshotValidationFailed extends Schema.TaggedError<SnapshotValidationFailed>()(
  "SnapshotValidationFailed",
  {
    message: Schema.String,
    errors: Schema.Array(Schema.String),
  },
) {}

export class SnapshotExportFailed extends Schema.TaggedError<SnapshotExportFailed>()("SnapshotExportFailed", {
  message: Schema.String,
}) {}

export class SnapshotImportFailed extends Schema.TaggedError<SnapshotImportFailed>()("SnapshotImportFailed", {
  message: Schema.String,
}) {}

export class PreviousSnapshotNotFound extends Schema.TaggedError<PreviousSnapshotNotFound>()(
  "PreviousSnapshotNotFound",
  {
    message: Schema.String,
  },
) {}
