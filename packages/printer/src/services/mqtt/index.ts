import crypto from "crypto";
import { Context, Effect, Ref, Schedule, SynchronizedRef } from "effect";
import mqtt from "mqtt";
import { MQTTConnectionError, MQTTPublishError, MQTTSubscribeError } from "./errors";

// Constants for retry policy
const RETRY_DELAY = "1 seconds";
const MAX_RETRIES = 0;

export class MQTTService extends Effect.Service<MQTTService>()("@warehouse/mqtt", {
  effect: Effect.gen(function* (_) {
    const connectWithoutRetry = (brokerUrl: string, orgId: string, prefix: string, clientId: string) =>
      Effect.async<mqtt.MqttClient, MQTTConnectionError>((resume) => {
        const mqttClient = mqtt.connect(brokerUrl, {
          protocolVersion: 5,
          // protocol: "wss",
          manualConnect: true,
          username: "", // !! KEEP EMPTY !!
          password: orgId,
          // clientId: clientId,
          keepalive: 30,
          connectTimeout: 60 * 1000,
          // reconnectPeriod: 1000, // Reconnect every second
          // clean: false, // Maintain session
          resubscribe: true, // Auto resubscribe
          // will: {
          //   // Last will message
          //   topic: `${prefix}/${orgId}/status`,
          //   payload: "disconnected",
          //   qos: 1,
          //   retain: true,
          // },
        });
        let connected = false;
        mqttClient.on("connect", (connack) => {
          if (!connected) {
            console.log("MQTT Client Connected:", connack);
            connected = true;
            resume(Effect.succeed(mqttClient));
          } else {
            console.log("MQTT Client Reconnected:", connack);
            // Ensure client is still working after reconnect
            mqttClient.publish(`${prefix}/${orgId}/status`, "connected", { retain: true });
          }
        });
        mqttClient.on("reconnect", () => {
          console.log("MQTT Client Reconnecting...");
        });
        mqttClient.on("offline", () => {
          console.log("MQTT Client Offline (attempting to reconnect...)");
          // Force reconnection attempt
          mqttClient.reconnect();
        });
        mqttClient.on("error", (error) => {
          console.error("MQTT Client Error:", error);
          if (!connected) {
            resume(Effect.fail(new MQTTConnectionError({ message: String(error) })));
          } else {
            console.log("Normal MQTT Client Error:", error);
          }
        });
        mqttClient.connect();
      });

    const connect = (brokerUrl: string, orgId: string, prefix: string, clientId: string) =>
      Effect.gen(function* (_) {
        // return yield* connectWithoutRetry(brokerUrl, orgId);
        const retryPolicy = Schedule.intersect(Schedule.exponential(RETRY_DELAY), Schedule.recurs(MAX_RETRIES));
        const client = yield* Effect.retry(connectWithoutRetry(brokerUrl, orgId, prefix, clientId), retryPolicy);
        // const ping = Schedule.spaced("1 seconds");
        // yield* Effect.fork(
        //   Effect.schedule(
        //     Effect.sync(() => client.sendPing()),
        //     ping,
        //   ),
        // );
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
        client.subscribe(topic, { qos: 1 }, (error) => {
          if (error) {
            resume(Effect.fail(new MQTTSubscribeError({ message: String(error) })));
            return;
          }

          client.on("message", async (receivedTopic, message) => {
            if (receivedTopic === topic) {
              const td = new TextDecoder();
              const pl = td.decode(message);
              await callback(pl);
            } else {
              console.log("Received message", receivedTopic);
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
