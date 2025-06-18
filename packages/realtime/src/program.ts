import { Effect, Schema } from "effect";
import { MQTTLive, MQTTService } from "./services/mqtt";
import { createEventHandler, InfallibleEventHandler } from "./types";

export const program = <A, I>(brokerUrl: string, clientId: string, handlers: InfallibleEventHandler<A, I>[]) =>
  Effect.gen(function* (_) {
    const mqtt = yield* _(MQTTService);

    yield* Effect.acquireRelease(mqtt.connect(brokerUrl, clientId), (client, exit) => mqtt.disconnect(client));

    const unsubscribers = yield* mqtt.subscribe(handlers);

    yield* Effect.addFinalizer(() => Effect.all(unsubscribers));

    return yield* Effect.forever(Effect.void);
  }).pipe(Effect.provide(MQTTLive));
