import crypto from "crypto";
import { RealtimeEvents } from "@warehouseoetzidev/core/src/entities/realtime";
import { Config, Console, Effect, Option, PubSub, Queue, Schedule } from "effect";
import { IncomingListenMessage, MqttClient, TcpTransport, WebsocketTransport } from "mqtts";
import { MQTTConnectionError, MQTTPublishError, MQTTSubscribeError } from "./errors";

export class MQTTService extends Effect.Service<MQTTService>()("@warehouse/mqtt", {
  effect: Effect.gen(function* () {
    const isSST = Option.isSome(yield* Config.option(Config.string("SST_RESOURCE_App")));
    const te = new TextEncoder();

    const connectWithoutRetry = (brokerUrl: string, orgId: string, prefix: string, clientId: string) =>
      Effect.gen(function* () {
        const url = new URL(brokerUrl);
        const client = new MqttClient({
          transport: isSST
            ? new WebsocketTransport({
                url: brokerUrl,
                // additionalOptions: {
                //   protocol: "wss",
                //   followRedirects: true,
                //   protocolVersion: 13,
                // },
              })
            : new TcpTransport({
                host: url.hostname,
                port: parseInt(url.port) || 1883,
              }),
          autoReconnect: true,
        });

        yield* Console.log("Connecting to broker:", brokerUrl);
        yield* Effect.async<MqttClient, MQTTConnectionError>((resume) => {
          client
            .connect(
              isSST
                ? {
                    clean: true,
                    clientId: clientId,
                    username: "",
                    password: orgId,
                    keepAlive: 60,
                    will: {
                      // Last will message
                      topic: `${prefix}/${orgId}/realtime/status`,
                      message: "disconnected",
                      qosLevel: 1,
                      retained: true,
                    },
                  }
                : undefined,
            )
            .catch((error) => {
              console.log(error);
              resume(Effect.fail(new MQTTConnectionError({ message: String(error) })));
            })
            .then(() => {
              resume(Effect.succeed(client));
            });
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
        });

        yield* Console.log("Connected to broker");
        return client;
      });

    const connect = (brokerUrl: string, orgId: string, prefix: string, clientId: string) =>
      Effect.gen(function* () {
        const retryPolicy = Schedule.intersect(Schedule.exponential("1 seconds"), Schedule.recurs(5));
        const client = yield* Effect.retry(connectWithoutRetry(brokerUrl, orgId, prefix, clientId), retryPolicy);
        return yield* Effect.succeed(client);
      });

    const publish = (client: MqttClient, topic: string, message: string) =>
      Effect.tryPromise({
        try: () => client.publish({ topic, payload: message, qosLevel: 1 }),
        catch: (error) => Effect.fail(new MQTTPublishError({ message: "Failed to publish to MQTT" })),
      });

    const subscribe = (client: MqttClient, topic: string) =>
      Effect.gen(function* () {
        // const t = isSST ? topic : topic.replaceAll("#", "*");
        yield* Console.log("Subscribing to topic", topic);

        const pubsub = yield* PubSub.bounded<RealtimeEvents>(100);
        const queue = yield* PubSub.subscribe(pubsub);

        const unsub = yield* Effect.promise(() =>
          client.listenSubscribe(topic, (message: IncomingListenMessage<RealtimeEvents>) => {
            Effect.runFork(PubSub.publish(pubsub, JSON.parse(new TextDecoder().decode(message.payload))));
          }),
        );

        yield* Console.log("Subscribed to topic", topic);

        return {
          unsub,
          queue,
          publish: (message: RealtimeEvents) => PubSub.publish(pubsub, message),
          take: () => Queue.take(queue),
        };
      });

    const disconnect = (client: MqttClient) => Effect.promise(() => client.disconnect());

    return {
      connect,
      publish,
      subscribe,
      disconnect,
    } as const;
  }),
}) {}

export const MQTTLive = MQTTService.Default;
