import { Effect } from "effect";
import { MQTTLive, MQTTService } from "./services/mqtt";
import { InfallibleEventHandler } from "./types";

export const program = <A, I>(brokerUrl: string, clientId: string, handlers: InfallibleEventHandler<A, I>[]) =>
  Effect.gen(function* (_) {
    const mqtt = yield* MQTTService;
    yield* Effect.log(`Connecting to MQTT via ${brokerUrl}...`);
    yield* Effect.acquireRelease(mqtt.connect(brokerUrl, clientId), (client) => mqtt.disconnect(client));
    yield* Effect.log("Subscribing to MQTT...", handlers.map((h) => h.channel).join(", "));
    const unsubscribers = yield* mqtt.subscribe(handlers);
    yield* Effect.addFinalizer(() => Effect.all(unsubscribers));
    yield* Effect.log("Starting...");
    return yield* Effect.forever(Effect.void);
  }).pipe(Effect.provide(MQTTLive));
