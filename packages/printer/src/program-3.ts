import { prefix } from "@effect/platform/KeyValueStore";
import { RealtimeLive, RealtimeService } from "@warehouseoetzidev/core/src/entities/realtime";
import { Cause, Chunk, Console, Effect, Exit, Redacted, Schedule, Stream } from "effect";
import { PrinterConfig, PrinterConfigLive } from "./config";
import { MQTTLive, MQTTService } from "./services/mqtt-3";
import { PrinterLive, PrinterService } from "./services/printer";

export const program = Effect.gen(function* (_) {
  yield* Console.log("Preparing...");
  const C = yield* _(PrinterConfig);
  const RT = yield* _(RealtimeService);
  const config = yield* C.getConfig;
  const org_id = Redacted.value(config.OrgId);
  const brokerUrl = Redacted.value(config.BrokerUrl);
  const prefix = Redacted.value(config.Prefix);
  const clientId = Redacted.value(config.ClientId);
  const x = yield* RT.forPrinter(prefix, org_id);
  const channel = x.subscribe[0];
  // const pingChannel = x.publish;

  const mqtt = yield* _(MQTTService);
  const printer = yield* _(PrinterService);
  yield* Console.log("Starting...", { brokerUrl, org_id, prefix, channel });

  // yield* Effect.sleep(1000);

  const client = yield* Effect.acquireRelease(mqtt.connect(brokerUrl, org_id, prefix, clientId), (client, exit) =>
    mqtt.disconnect(client),
  );

  const subscription = yield* mqtt.subscribe(client, channel);

  const messageHandler = Effect.gen(function* (_) {
    while (true) {
      const packet = yield* subscription.take();
      const message = packet.payload;

      if (message === "ignore:ping") {
        yield* Console.log("Ignoring ping");
        continue;
      }

      yield* Console.log("Received message", message);

      const json = JSON.parse(message);
      if (!json.messages) return;

      yield* Effect.scoped(
        Effect.gen(function* (_) {
          const device = yield* printer.device();
          yield* printer.print(device, {
            text: [
              {
                content: `Print messages with length ${json.messages.length}`,
                align: "lt",
                style: "normal",
              },
              {
                content: json.messages.join(", "),
                style: "normal",
                align: "lt",
              },
            ],
          });
        }),
      );
    }
  });

  yield* Effect.fork(messageHandler);

  const ping = Effect.gen(function* (_) {
    yield* Console.log("Pinging...");
    // yield* mqtt.publish(client, channel, "ignore:ping");
    yield* subscription.publish({
      type: "ping",
      action: "ignore",
      payload: "ignore:ping",
    });
    yield* subscription.publish({
      type: "print",
      action: "created",
      payload: JSON.stringify({ messages: ["hellooo"] }),
    });
  });

  yield* Effect.addFinalizer(() =>
    Effect.all([Console.log("Cleaning up..."), Effect.sync(() => subscription.unsub())]),
  );

  const schedule = Schedule.spaced("1 seconds");
  yield* Effect.schedule(ping, schedule);

  return yield* Effect.never;
}).pipe(
  Effect.provide(MQTTLive),
  Effect.provide(PrinterLive),
  Effect.provide(PrinterConfigLive),
  Effect.provide(RealtimeLive),
);
