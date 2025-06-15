import { prefix } from "@effect/platform/KeyValueStore";
import { RealtimeLive, RealtimeService } from "@warehouseoetzidev/core/src/entities/realtime";
import { Cause, Chunk, Console, Effect, Exit, Redacted, Schedule, Stream } from "effect";
import { PrinterConfig, PrinterConfigLive } from "./config";
import { MQTTLive, MQTTService } from "./services/mqtt-2";
import { PrinterLive, PrinterService } from "./services/printer";

export const program = Effect.gen(function* (_) {
  yield* Console.log("Preparing...");
  const C = yield* _(PrinterConfig);
  const RT = yield* _(RealtimeService);
  const config = yield* C.getConfig;
  const org_id = Redacted.value(config.OrgId);
  const brokerUrl = Redacted.value(config.BrokerUrl);
  const prefix = Redacted.value(config.Prefix);
  const x = yield* RT.forPrinter(prefix, org_id);
  const channel = x.subscribe[0];
  // const pingChannel = x.publish;

  const mqtt = yield* _(MQTTService);
  const printer = yield* _(PrinterService);
  yield* Console.log("Starting...", { brokerUrl, org_id, prefix, channel });

  // yield* Effect.sleep(1000);

  const client = yield* Effect.acquireRelease(mqtt.connect(brokerUrl, org_id), (client, exit) =>
    Effect.sync(() => mqtt.disconnect(client)),
  );
  const td = new TextDecoder();

  const stream = yield* mqtt.subscribe(client, channel);

  const fiber = yield* Effect.fork(
    stream.pipe(
      Stream.runForEach((packet) =>
        Effect.gen(function* (_) {
          // yield* Console.log("Received message", packet.payload);
          const message = td.decode(packet.payload);
          if (!message) {
            yield* Console.log("Invalid message");
            return;
          }
          if (message === "ignore:ping") {
            yield* Console.log("Ignoring ping");
            return;
          }
          const json = JSON.parse(message);
          if (!json.payload) {
            return;
          }
          const payload = json.payload;
          if (!payload.message) {
            return;
          }
          console.log("Received message", payload.message);

          return yield* Effect.scoped(
            Effect.gen(function* (_) {
              const device = yield* printer.device();
              yield* printer.print(device, {
                text: [
                  {
                    content: `Pring message with length ${payload.message.length}`,
                    align: "lt",
                    style: "normal",
                  },
                  { content: payload.message, style: "normal", align: "lt" },
                ],
              });
            }),
          );
        }),
      ),
    ),
  );
  yield* Effect.addFinalizer(() => Effect.all([fiber.interruptAsFork(fiber.id()), Console.log("Stopping...")]));
  // yield* Console.log("AAAAAAAAAA");

  const ping = Effect.gen(function* (_) {
    // yield* mqtt.publish(client, channel, "ignore:ping");
    yield* mqtt.publish(client, channel, JSON.stringify({ payload: { message: "hellooo" } }));
    // yield* mqtt.publish(client, pingChannel, "ping");
  });
  const schedule = Schedule.spaced("1 seconds");
  yield* Effect.schedule(ping, schedule);

  return yield* Effect.forever(Effect.void);
}).pipe(
  Effect.provide(MQTTLive),
  Effect.provide(PrinterLive),
  Effect.provide(PrinterConfigLive),
  Effect.provide(RealtimeLive),
);
