import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";
import { createTransport } from "nodemailer";

const EmailTransportConfigSchema = Schema.Struct({
  name: Schema.String,
  host: Schema.String,
  port: Schema.Number,
  auth: Schema.Struct({ user: Schema.String, pass: Schema.String }),
});
type EmailTransportConfig = typeof EmailTransportConfigSchema.Type;

export class MissingConfig extends Schema.TaggedError<MissingConfig>("MissingConfig")("MissingConfig", {
  key: Schema.String,
  value: Schema.optional(Schema.String),
  values: Schema.optional(Schema.Array(Schema.String)),
}) {}

export class WarehouseConfig extends Context.Tag("@warehouse/config")<
  WarehouseConfig,
  {
    readonly getConfig: Effect.Effect<
      {
        readonly DatabaseUrl: Redacted.Redacted<string>;
        readonly DatabaseProvider: string;
        readonly JWTSecret1: Redacted.Redacted<string>;
        readonly JWTSecret2: Redacted.Redacted<string>;
        readonly IsLocal: boolean;
        readonly BinaryDownloadBaseUrl: string;
        readonly DefaultBinaryTargetFolderPath: string;
        readonly EmailTransportConfig: EmailTransportConfig;
      },
      MissingConfig
    >;
  }
>() {}

export const WarehouseConfigLive = Layer.succeed(
  WarehouseConfig,
  WarehouseConfig.of({
    getConfig: Effect.gen(function* (_) {
      const env = process.env;
      const statsWithSST = Object.entries(env).filter(([key]) => key.startsWith("SST_")).length > 0;
      if (!statsWithSST) {
        const dbUrl = yield* Config.redacted("DATABASE_URL").pipe(
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "DATABASE_URL" })),
          }),
        );
        const jwtSecret1 = yield* Config.redacted("JWT_SECRET_1").pipe(
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "JWT_SECRET_1" })),
          }),
        );
        const jwtSecret2 = yield* Config.redacted("JWT_SECRET_2").pipe(
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "JWT_SECRET_2" })),
          }),
        );
        const binaryDownloadBaseUrl = yield* Config.string("BINARY_DOWNLOAD_BASE_URL").pipe(
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "BINARY_DOWNLOAD_BASE_URL" })),
          }),
        );
        const defaultBinaryTargetFolderPath = yield* Config.string("DEFAULT_BINARY_TARGET_FOLDER_PATH").pipe(
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "DEFAULT_BINARY_TARGET_FOLDER_PATH" })),
          }),
        );
        const emailName = yield* Config.string("EMAIL_NAME").pipe(
          Config.validate({
            message: "EMAIL_NAME must be a string in this format: Name <name@domain>",
            validation: (x) => x.length > 0 && new RegExp(/\w+\s+<.*@.*>/).test(x),
          }),
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "EMAIL_NAME" })),
          }),
        );
        const emailUsername = yield* Config.string("EMAIL_USERNAME").pipe(
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "EMAIL_USERNAME" })),
          }),
        );
        const emailPassword = yield* Config.string("EMAIL_PASSWORD").pipe(
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "EMAIL_PASSWORD" })),
          }),
        );
        const emailHost = yield* Config.string("EMAIL_HOST").pipe(
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "EMAIL_HOST" })),
          }),
        );
        const emailPort = yield* Config.number("EMAIL_PORT").pipe(
          Effect.catchTags({
            ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "EMAIL_PORT" })),
          }),
        );
        const emailTransportConfig: EmailTransportConfig = {
          name: emailName,
          host: emailHost,
          port: emailPort,
          auth: {
            user: emailUsername,
            pass: emailPassword,
          },
        };
        return {
          DatabaseProvider: "local",
          DatabaseUrl: dbUrl,
          JWTSecret1: jwtSecret1,
          JWTSecret2: jwtSecret2,
          BinaryDownloadBaseUrl: binaryDownloadBaseUrl,
          DefaultBinaryTargetFolderPath: defaultBinaryTargetFolderPath,
          IsLocal: true,
          EmailTransportConfig: emailTransportConfig,
        };
      } else {
        const { Resource } = yield* Effect.promise(() => import("sst"));
        const value = Resource.DatabaseUrl.value;
        if (!value) {
          return yield* Effect.fail(MissingConfig.make({ key: "DatabaseUrl" }));
        }
        const dbUrl = Redacted.make(value);
        const jwtSecret1Value = Resource.JWTSecret1.value;
        const jwtSecret2Value = Resource.JWTSecret2.value;
        // @ts-ignore
        const binaryDownloadBaseUrlValue = Resource.BinaryDownloadBaseUrl.value;
        // @ts-ignore
        const defaultBinaryTargetFolderPathValue = Resource.DefaultBinaryTargetFolderPath.value;
        // @ts-ignore
        const emailNameValue = Resource.EmailName.value;
        // @ts-ignore
        const emailHostValue = Resource.EmailHost.value;
        // @ts-ignore
        const emailPortValue = Resource.EmailPort.value;
        // @ts-ignore
        const emailUsernameValue = Resource.EmailUsername.value;
        // @ts-ignore
        const emailPasswordValue = Resource.EmailPassword.value;

        const emailTransportConfigValue: EmailTransportConfig = {
          name: emailNameValue,
          host: emailHostValue,
          port: emailPortValue,
          auth: {
            user: emailUsernameValue,
            pass: emailPasswordValue,
          },
        };

        if (!jwtSecret1Value) {
          return yield* Effect.fail(MissingConfig.make({ key: "JWTSecret1" }));
        }
        if (!jwtSecret2Value) {
          return yield* Effect.fail(MissingConfig.make({ key: "JWTSecret2" }));
        }
        if (!binaryDownloadBaseUrlValue) {
          return yield* Effect.fail(MissingConfig.make({ key: "BinaryDownloadBaseUrl" }));
        }
        if (!defaultBinaryTargetFolderPathValue) {
          return yield* Effect.fail(MissingConfig.make({ key: "DefaultBinaryTargetFolderPath" }));
        }
        const jwtSecret1 = Redacted.make(jwtSecret1Value);
        const jwtSecret2 = Redacted.make(jwtSecret2Value);

        return {
          DatabaseProvider: "local",
          DatabaseUrl: dbUrl,
          JWTSecret1: jwtSecret1,
          JWTSecret2: jwtSecret2,
          BinaryDownloadBaseUrl: binaryDownloadBaseUrlValue,
          DefaultBinaryTargetFolderPath: defaultBinaryTargetFolderPathValue,
          IsLocal: false,
          EmailTransportConfig: emailTransportConfigValue,
        };
      }
    }),
  }),
);
