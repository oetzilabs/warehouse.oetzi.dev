import { BunRuntime } from "@effect/platform-bun";
import { Config, Effect, Schema } from "effect";
import { program } from "./program";
import { createEventHandler } from "./types";

BunRuntime.runMain(
  Effect.gen(function* () {
    const brokerUrl = yield* Config.string("BROKER_URL");
    const clientId = "local";
    return yield* Effect.scoped(
      program(brokerUrl, clientId, [
        createEventHandler({
          channel: "realtime/:any",
          schema: Schema.String,
          handle: (topic, params, data) =>
            Effect.gen(function* () {
              yield* Effect.log("Received message for topic", topic, params, data);
            }),
        }),
      ]),
    );
  }),
);

export {};
