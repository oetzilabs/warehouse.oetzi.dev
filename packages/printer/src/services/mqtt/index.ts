import { Context, Effect, Ref, Schedule, SynchronizedRef } from "effect";
import mqtt from "mqtt";
import { MQTTConnectionError, MQTTPublishError, MQTTSubscribeError } from "./errors";

// Constants for retry policy
const RETRY_DELAY = "1 seconds";
const MAX_RETRIES = 5;

export class MQTTService extends Effect.Service<MQTTService>()("@warehouse/mqtt", {
  effect: Effect.gen(function* (_) {
    const clientRef: SynchronizedRef.SynchronizedRef<mqtt.MqttClient | undefined> = yield* SynchronizedRef.make<
      mqtt.MqttClient | undefined
    >(undefined);

    const connectWithoutRetry = (brokerUrl: string) =>
      Effect.async<mqtt.MqttClient, MQTTConnectionError>((resume) => {
        const mqttClient = mqtt.connect(brokerUrl);
        mqttClient.on("connect", () => {
          resume(Effect.succeed(mqttClient));
        });
        mqttClient.on("error", (error) => {
          resume(Effect.fail(new MQTTConnectionError({ message: String(error) })));
        });
      });

    const connect = (brokerUrl: string) =>
      Effect.gen(function* (_) {
        const retryPolicy = Schedule.intersect(Schedule.exponential(RETRY_DELAY), Schedule.recurs(MAX_RETRIES));
        const client = yield* Effect.retry(connectWithoutRetry(brokerUrl), retryPolicy);
        yield* Ref.update(clientRef, () => client);
      });

    const publish = (topic: string, message: string) =>
      Effect.gen(function* (_) {
        const client = yield* Ref.get(clientRef);
        if (!client) {
          return yield* Effect.fail(new MQTTConnectionError({ message: "Client not connected" }));
        }
        yield* Effect.async<void, MQTTConnectionError | MQTTPublishError>((resume) => {
          client.publish(topic, message, (error) => {
            if (error) {
              resume(Effect.fail(new MQTTPublishError({ message: String(error) })));
            } else {
              resume(Effect.succeed(void 0));
            }
          });
        });
      });

    const subscribe = (topic: string, callback: (message: string) => Promise<void>) =>
      Effect.gen(function* (_) {
        const client = yield* Ref.get(clientRef);
        if (!client) return yield* Effect.fail(new MQTTConnectionError({ message: "Client not connected" }));
        yield* Effect.async<void, MQTTConnectionError | MQTTSubscribeError>((resume) => {
          client.subscribe(topic, (error) => {
            if (error) {
              resume(Effect.fail(new MQTTSubscribeError({ message: String(error) })));
              return;
            }

            client.on("message", async (receivedTopic, message) => {
              if (receivedTopic === topic) {
                await callback(message.toString());
              }
            });

            resume(Effect.succeed(void 0));
          });
        });
      });

    const disconnect = () =>
      Effect.gen(function* (_) {
        const client = yield* SynchronizedRef.get(clientRef);
        if (client) {
          client.end();
          yield* SynchronizedRef.update(clientRef, () => undefined);
          return yield* Effect.succeed(void 0);
        }
      });

    return {
      connect,
      publish,
      subscribe,
      disconnect,
    } as const;
  }),
}) {}

export const MQTTLive = MQTTService.Default;
