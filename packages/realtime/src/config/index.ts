import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";

export class MissingConfig extends Schema.TaggedError<MissingConfig>("MissingConfig")("MissingConfig", {
  key: Schema.String,
  value: Schema.optional(Schema.String),
  values: Schema.optional(Schema.Array(Schema.String)),
}) {}

export class RealtimeConfig extends Context.Tag("@warehouse/config")<
  RealtimeConfig,
  {
    readonly getConfig: Effect.Effect<
      {
        readonly BrokerUrl: Redacted.Redacted<string>;
      },
      MissingConfig
    >;
  }
>() {}

export const RealtimeConfigLive = Layer.succeed(
  RealtimeConfig,
  RealtimeConfig.of({
    getConfig: Effect.gen(function* (_) {
      const brokerUrl = yield* Config.redacted("BROKER_URL").pipe(
        Effect.catchTags({
          ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "BROKER_URL" })),
        }),
      );
      return {
        BrokerUrl: brokerUrl,
      };
    }),
  }),
);
