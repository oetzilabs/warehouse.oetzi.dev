import { Schema } from "effect";

export class SupplierNotFound extends Schema.TaggedError<SupplierNotFound>()("SupplierNotFound", {
  id: Schema.String,
}) {}

export class SupplierInvalidId extends Schema.TaggedError<SupplierInvalidId>()("SupplierInvalidId", {
  id: Schema.String,
}) {}

export class SupplierNotCreated extends Schema.TaggedError<SupplierNotCreated>()("SupplierNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class SupplierContactNotCreated extends Schema.TaggedError<SupplierContactNotCreated>()(
  "SupplierContactNotCreated",
  {
    supplierId: Schema.String,
  },
) {}

export class SupplierNoteNotCreated extends Schema.TaggedError<SupplierNoteNotCreated>()("SupplierNoteNotCreated", {
  supplierId: Schema.String,
}) {}
