import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";

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
        return {
          DatabaseProvider: "local",
          DatabaseUrl: dbUrl,
          JWTSecret1: jwtSecret1,
          JWTSecret2: jwtSecret2,
          BinaryDownloadBaseUrl: binaryDownloadBaseUrl,
          DefaultBinaryTargetFolderPath: defaultBinaryTargetFolderPath,
          IsLocal: true,
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
        };
      }
    }),
  }),
);
