import { Effect, Schema } from "effect";
import { MQTTLive, MQTTService } from "./services/mqtt";
import { createEventHandler } from "./types";

export const program = (brokerUrl: string, clientId: string) =>
  Effect.gen(function* (_) {
    const mqtt = yield* _(MQTTService);

    yield* Effect.acquireRelease(mqtt.connect(brokerUrl, clientId), (client, exit) => mqtt.disconnect(client));

    const handlers = [
      createEventHandler({
        channel: "realtime/:any",
        schema: Schema.String,
        handle: (topic, params, data) =>
          Effect.gen(function* () {
            yield* Effect.log("Received message for topic", topic, params, data);
          }),
      }),
    ];

    const unsubscribers = yield* mqtt.subscribe(handlers);

    yield* Effect.addFinalizer(() => Effect.all(unsubscribers));

    return yield* Effect.forever(Effect.void);
  }).pipe(Effect.provide(MQTTLive));
