import crypto from "crypto";
import events from "events";
import { AuthenticationResult } from "@seriousme/opifex/mqttPacket";
import * as mqtt from "@seriousme/opifex/tcpClient";
import { Config, Console, Effect, Option, Schedule, Stream } from "effect";
import { MQTTConnectionError, MQTTPublishError, MQTTSubscribeError } from "./errors";

events.setMaxListeners(1000);

// Constants for retry policy
const RETRY_DELAY = "1 seconds";
const MAX_RETRIES = 5;

export class MQTTService extends Effect.Service<MQTTService>()("@warehouse/mqtt", {
  effect: Effect.gen(function* (_) {
    console.log(process.env);
    const isSST = Option.isSome(yield* Config.option(Config.string("SST_RESOURCE_App")));

    const te = new TextEncoder();
    const connectWithoutRetry = (brokerUrl: string, orgId: string) =>
      Effect.gen(function* (_) {
        const mqttClient = new mqtt.TcpClient();
        const cliendId = crypto.randomUUID();

        yield* Console.log("Connecting to broker:", brokerUrl, cliendId);
        const result = yield* Effect.tryPromise({
          try: () =>
            mqttClient.connect({
              url: new URL(brokerUrl),
              options: isSST
                ? {
                    clean: true,
                    clientId: cliendId,
                    username: "",
                    password: te.encode(orgId),
                  }
                : undefined,
            }),
          catch: (error) => {
            // Log the full error object for more detail
            // void console.error("Error during mqttClient.connect:", error);

            return Effect.fail(new MQTTConnectionError({ message: String(error) }));
          },
        });
        yield* Console.log("Connected to broker", result);
        return mqttClient;
      });

    const connect = (brokerUrl: string, orgId: string) =>
      Effect.gen(function* (_) {
        const retryPolicy = Schedule.intersect(Schedule.exponential(RETRY_DELAY), Schedule.recurs(MAX_RETRIES));
        const client = yield* Effect.retry(connectWithoutRetry(brokerUrl, orgId), retryPolicy);
        return yield* Effect.succeed(client);
      });

    const publish = (client: mqtt.TcpClient, topic: string, message: string) =>
      Effect.tryPromise({
        try: () => client.publish({ topic, payload: te.encode(message), qos: 1 }),
        catch: (error) => {
          console.log(error);
          return Effect.fail(new MQTTPublishError({ message: "Failed to publish to MQTT" }));
        },
      });

    const subscribe = (client: mqtt.TcpClient, topic: string) =>
      Effect.gen(function* (_) {
        yield* Console.log("Subscribing to topic", topic);
        yield* Effect.tryPromise({
          try: () =>
            client.subscribe({
              subscriptions: [
                {
                  topicFilter: topic,
                  qos: 1,
                },
              ],
            }),
          catch: (error) => {
            console.log(error);
            return Effect.fail(new MQTTSubscribeError({ message: "Failed to subscribe to MQTT" }));
          },
        });
        return Stream.fromAsyncIterable(client.messages(), (e) => new Error(String(e)));
      }).pipe(Effect.catchAll((e) => Effect.fail(new MQTTSubscribeError({ message: "Failed to subscribe to MQTT" }))));

    const disconnect = (client: mqtt.TcpClient) =>
      Effect.all([Effect.sync(() => client.closeMessages()), Effect.promise(() => client.disconnect())]);

    return {
      connect,
      publish,
      subscribe,
      disconnect,
    } as const;
  }),
}) {}

export const MQTTLive = MQTTService.Default;
