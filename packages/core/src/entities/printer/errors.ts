import { Schema } from "effect";

export class PrinterNotFound extends Schema.TaggedError<PrinterNotFound>()("PrinterNotFound", {
  id: Schema.String,
}) {}

export class PrinterInvalidId extends Schema.TaggedError<PrinterInvalidId>()("PrinterInvalidId", {
  id: Schema.String,
}) {}

export class PrinterNotCreated extends Schema.TaggedError<PrinterNotCreated>()("PrinterNotCreated", {
  message: Schema.optional(Schema.String),
}) {}

export class PrinterNotUpdated extends Schema.TaggedError<PrinterNotUpdated>()("PrinterNotUpdated", {
  id: Schema.String,
}) {}

export class PrinterNotDeleted extends Schema.TaggedError<PrinterNotDeleted>()("PrinterNotDeleted", {
  id: Schema.String,
}) {}

export class PrinterOrganizationInvalidId extends Schema.TaggedError<PrinterOrganizationInvalidId>()(
  "PrinterOrganizationInvalidId",
  {
    organizationId: Schema.String,
  },
) {}

export class PrinterTypeInvalidId extends Schema.TaggedError<PrinterTypeInvalidId>()("PrinterTypeInvalidId", {
  type: Schema.String,
}) {}

export class PrinterNotConnected extends Schema.TaggedError<PrinterNotConnected>()("PrinterNotConnected", {
  message: Schema.optional(Schema.String),
}) {}
