import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";

export class MissingConfig extends Schema.TaggedError<MissingConfig>("MissingConfig")("MissingConfig", {
  key: Schema.String,
  value: Schema.optional(Schema.String),
  values: Schema.optional(Schema.Array(Schema.String)),
}) {}

export class PrinterConfig extends Context.Tag("@warehouse/config")<
  PrinterConfig,
  {
    readonly getConfig: Effect.Effect<
      {
        readonly OrgId: Redacted.Redacted<string>;
        readonly BrokerUrl: Redacted.Redacted<string>;
      },
      MissingConfig
    >;
  }
>() {}

export const PrinterConfigLive = Layer.succeed(
  PrinterConfig,
  PrinterConfig.of({
    getConfig: Effect.gen(function* (_) {
      const env = process.env;
      const org_id = yield* Config.redacted("ORG_ID").pipe(
        Effect.catchTags({
          ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "ORG_ID" })),
        }),
      );
      const brokerUrl = yield* Config.redacted("BROKER_URL").pipe(
        Effect.catchTags({
          ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "BROKER_URL" })),
        }),
      );
      return {
        BrokerUrl: brokerUrl,
        OrgId: org_id,
      };
    }),
  }),
);
