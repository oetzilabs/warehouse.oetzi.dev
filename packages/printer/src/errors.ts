import { Schema } from "effect";

export class PrinterNotFound extends Schema.TaggedError<PrinterNotFound>()("PrinterNotFound", {
  message: Schema.optional(Schema.String),
  type: Schema.optional(Schema.Literal("usb", "bluetooth", "network", "serial")),
}) {}

export class PrinterNotConnected extends Schema.TaggedError<PrinterNotConnected>()("PrinterNotConnected", {
  message: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class PrintOperationError extends Schema.TaggedError<PrintOperationError>()("PrintOperationError", {
  message: Schema.String,
  operation: Schema.String,
  value: Schema.optional(Schema.Any),
  cause: Schema.optional(Schema.Any),
}) {}

export class PrinterBluetoothCountError extends Schema.TaggedError<PrinterBluetoothCountError>()(
  "PrinterBluetoothCountError",
  {
    message: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class PrinterFailedToGetBluetoothAdress extends Schema.TaggedError<PrinterFailedToGetBluetoothAdress>()(
  "PrinterFailedToGetBluetoothAdress",
  {
    message: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class PrinterFailedToGetBluetoothAdapter extends Schema.TaggedError<PrinterFailedToGetBluetoothAdapter>()(
  "PrinterFailedToGetBluetoothAdapter",
  {
    message: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class PrinterBluetoothBindingError extends Schema.TaggedError<PrinterBluetoothBindingError>()(
  "PrinterBluetoothBindingError",
  {
    message: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class PrinterFailedToGetUSBDevices extends Schema.TaggedError<PrinterFailedToGetUSBDevices>()(
  "PrinterFailedToGetUSBDevices",
  {
    message: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ImageNotFound extends Schema.TaggedError<ImageNotFound>()("ImageNotFound", {
  message: Schema.optional(Schema.String),
  path: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class ImageNotLoaded extends Schema.TaggedError<ImageNotLoaded>()("ImageNotLoaded", {
  message: Schema.optional(Schema.String),
  path: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}
