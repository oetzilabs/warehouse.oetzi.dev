import { BunRuntime } from "@effect/platform-bun";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
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
          handle: Effect.fn("@warehouse/realtime/handle/:any")(
            function* (topic, params, data) {
              yield* Effect.log("Received message for topic", { topic, params, data });
            },
            (effect) => effect.pipe(Effect.provide([createOtelLayer("@warehouse/realtime/handle/:any")])),
          ),
        }),
      ]),
    ).pipe(Effect.provide([createOtelLayer("@warehouse/realtime")]));
  }),
);

export {};
