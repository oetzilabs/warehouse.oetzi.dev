import { Context, Effect, Ref, Schedule, SynchronizedRef } from "effect";
import mqtt from "mqtt";
import { MQTTConnectionError, MQTTPublishError, MQTTSubscribeError } from "./errors";

// Constants for retry policy
const RETRY_DELAY = "1 seconds";
const MAX_RETRIES = 5;

export class MQTTService extends Effect.Service<MQTTService>()("@warehouse/mqtt", {
  effect: Effect.gen(function* (_) {
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
        return yield* Effect.succeed(client);
      });

    const publish = (client: mqtt.MqttClient, topic: string, message: string) =>
      Effect.async<void, MQTTConnectionError | MQTTPublishError>((resume) => {
        client.publish(topic, message, (error) => {
          if (error) {
            resume(Effect.fail(new MQTTPublishError({ message: String(error) })));
          } else {
            resume(Effect.succeed(void 0));
          }
        });
      });

    const subscribe = (client: mqtt.MqttClient, topic: string, callback: (message: string) => Promise<void>) =>
      Effect.async<void, MQTTConnectionError | MQTTSubscribeError>((resume) => {
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

    const unsubscribe = (client: mqtt.MqttClient, topic: string) =>
      Effect.async<void, MQTTConnectionError | MQTTSubscribeError>((resume) => {
        client.unsubscribe(topic, (error) => {
          if (error) {
            resume(Effect.fail(new MQTTSubscribeError({ message: String(error) })));
          } else {
            resume(Effect.succeed(void 0));
          }
        });
      });

    const disconnect = (client: mqtt.MqttClient) => client.end();

    return {
      connect,
      publish,
      subscribe,
      unsubscribe,
      disconnect,
    } as const;
  }),
}) {}

export const MQTTLive = MQTTService.Default;
