import { BunRuntime } from "@effect/platform-bun";
import { NodeRuntime } from "@effect/platform-node";
import { RealtimeLive, RealtimeService } from "@warehouseoetzidev/core/src/entities/realtime";
import { Console, Duration, Effect, Redacted, Schedule, Sink, Stream } from "effect";
import { PrinterConfig, PrinterConfigLive } from "../config";
import * as Program from "../program-4";
import { MQTTLive, MQTTService } from "../services/mqtt-3";
import { PrinterLive } from "../services/printer";

export const program = Effect.gen(function* () {
  const RT = yield* RealtimeService;
  const Mqtt = yield* MQTTService;

  const C = yield* PrinterConfig;
  const config = yield* C.getConfig;
  const org_id = Redacted.value(config.OrgId);
  const brokerUrl = Redacted.value(config.BrokerUrl);
  const prefix = Redacted.value(config.Prefix);
  const clientId = Redacted.value(config.ClientId);

  const printerRealtimeTopics = yield* RT.forPrinter(prefix, org_id);

  const client = yield* Effect.acquireRelease(Mqtt.connect(brokerUrl, org_id, prefix, clientId), (client, exit) =>
    Mqtt.disconnect(client),
  );
  const channel = printerRealtimeTopics.subscribe[0];
  const { queue: incomingQueue, unsub } = yield* Mqtt.subscribe(client, channel);

  yield* Effect.addFinalizer(() => Effect.sync(() => unsub()));

  const { stream, enqueue } = yield* Program.Queuer;

  // transform the incoming queue into a stream
  const incomingStream = Stream.fromQueue(incomingQueue);
  yield* Stream.run(
    incomingStream.pipe(
      Stream.filter((message) => message.type === "print"),
      Stream.filter((message) => message.action === "created"),
    ),
    Sink.forEach((message) =>
      Effect.gen(function* () {
        yield* Console.log("Received message", message);
        yield* enqueue({
          text: [
            {
              content: message.payload,
              align: "ct",
              style: "normal",
            },
          ],
        });
      }),
    ),
  ).pipe(Effect.forever, Effect.fork);
  yield* Console.log("Starting...");

  yield* Program.main({ stream });
}).pipe(Effect.provide([PrinterLive, PrinterConfigLive, MQTTLive, RealtimeLive]));

BunRuntime.runMain(Effect.scoped(program));

export {};
