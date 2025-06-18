import { createId } from "@paralleldrive/cuid2";
import { RealtimeEvents } from "@warehouseoetzidev/core/src/entities/realtime";
import { Effect, HashMap, Option, PubSub, Ref, Schedule, Schema } from "effect";
import { MqttClient, TcpTransport } from "mqtts";
import { MqttListener } from "mqtts/dist/mqtt.listener";
import { InfallibleEventHandler, RealtimeEventHandler, SubscriptionId } from "../../types";
import { MQTTConnectionError, MQTTPublishError } from "./errors";

export class MQTTService extends Effect.Service<MQTTService>()("@warehouse/mqtt", {
  effect: Effect.gen(function* (_) {
    const clientRef = yield* Ref.make<MqttClient | null>(null);
    // const subscriptions = HashMap.empty<SubscriptionId, RealtimeEventHandler<any, any, any>>();

    // const pubsub = yield* PubSub.bounded<RealtimeEvents>(100);
    // const queue = yield* PubSub.subscribe(pubsub);

    const connect = (brokerUrl: string, clientId: string) =>
      Effect.gen(function* (_) {
        const retryPolicy = Schedule.intersect(Schedule.exponential("1 seconds"), Schedule.recurs(5));
        const client = yield* Effect.retry(
          Effect.gen(function* (_) {
            const url = new URL(brokerUrl);
            if (!url.port)
              return yield* Effect.fail(new MQTTConnectionError({ message: "Invalid broker URL, misising PORT" }));
            const client = new MqttClient({
              transport: new TcpTransport({
                host: url.hostname,
                port: parseInt(url.port),
              }),
              autoReconnect: true,
            });

            yield* Effect.async<MqttClient, MQTTConnectionError>((resume) => {
              client.on("connect", (connack) => {
                if (connack.isSuccess) {
                  resume(Effect.succeed(client));
                } else {
                  resume(Effect.fail(new MQTTConnectionError({ message: "Failed to connect to MQTT" })));
                }
              });
              client.on("error", (error) => {
                console.log(error);
                resume(Effect.fail(new MQTTConnectionError({ message: String(error) })));
              });
              client.on("SUBACK", (packet) => {});
              client
                .connect({
                  clean: true,
                  clientId: clientId,
                  keepAlive: 60,
                })
                .catch((error) => {
                  console.log(error);
                  resume(Effect.fail(new MQTTConnectionError({ message: String(error) })));
                })
                .then(() => {
                  resume(Effect.succeed(client));
                });
            });
            return client;
          }),
          retryPolicy,
        );

        yield* Ref.set(clientRef, client);
        return yield* Effect.succeed(client);
      });

    const publish = (topic: string, message: string) =>
      Effect.gen(function* () {
        const client = yield* Ref.get(clientRef);
        if (!client) return yield* Effect.fail(new MQTTPublishError({ message: "Client not connected" }));

        yield* Effect.tryPromise({
          try: () => client.publish({ topic, payload: message, qosLevel: 1 }),
          catch: (error) => Effect.fail(new MQTTPublishError({ message: "Failed to publish to MQTT" })),
        });
      });

    const subscribe = <A, I>(handlers: InfallibleEventHandler<A, I>[]) =>
      Effect.gen(function* (_) {
        const client = yield* Ref.get(clientRef);
        if (!client) return yield* Effect.fail(new MQTTPublishError({ message: "Client not connected" }));
        const td = new TextDecoder();
        const unsubbers: Effect.Effect<void, never, never>[] = [];
        yield* Effect.forEach(handlers, (handler) =>
          Effect.gen(function* () {
            // const id = SubscriptionId.make(createId());
            const unsub = yield* Effect.promise(() =>
              client.listenSubscribe(handler.channel, (message) => {
                Effect.runFork(
                  Effect.gen(function* (_) {
                    const event = td.decode(message.payload);
                    const payload = yield* Effect.option(Schema.decodeUnknown(handler.schema)(event));
                    if (Option.isNone(payload)) return;
                    yield* handler.handle(message.topic, message.params ?? {}, payload.value);
                  }),
                );
              }),
            );
            // HashMap.set(subscriptions, id, { ...handler, unsubscribe: Effect.sync(() => unsub()) });
            unsubbers.push(Effect.sync(() => unsub()));
          }),
        );
        return unsubbers;
      });

    const disconnect = (client: MqttClient) => Effect.promise(() => client.disconnect());

    return {
      connect,
      publish,
      subscribe,
      disconnect,
      // queue,
    } as const;
  }),
}) {}

export const MQTTLive = MQTTService.Default;
