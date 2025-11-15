import { Schema } from "effect";

export class TokenValidationError extends Schema.TaggedError<TokenValidationError>()("TokenValidationError", {
  token: Schema.String,
}) {}

export class TokenRefreshError extends Schema.TaggedError<TokenRefreshError>()("TokenRefreshError", {
  token: Schema.String,
}) {}

export class DeviceBannedError extends Schema.TaggedError<DeviceBannedError>()("DeviceBannedError", {
  message: Schema.String,
  deviceId: Schema.String,
  token: Schema.String,
}) {}

export class DeviceConfigNotFound extends Schema.TaggedError<DeviceConfigNotFound>()("DeviceConfigNotFound", {
  message: Schema.String,
}) {}

export class DeviceCapabilitiesNotFound extends Schema.TaggedError<DeviceCapabilitiesNotFound>()(
  "DeviceCapabilitiesNotFound",
  {
    message: Schema.String,
  },
) {}
