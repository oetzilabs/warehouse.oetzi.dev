import { RealtimeLive, RealtimeService } from "@warehouseoetzidev/core/src/entities/realtime";
import { Cause, Chunk, Console, Effect, Exit, Redacted, Schedule } from "effect";
import { PrinterConfig, PrinterConfigLive } from "./config";
import { MQTTLive, MQTTService } from "./services/mqtt";
import { PrinterLive, PrinterService } from "./services/printer";

export const program = Effect.gen(function* (_) {
  yield* Console.log("Preparing...");
  yield* Effect.addFinalizer(() => Console.log("Stopping..."));
  const C = yield* _(PrinterConfig);
  const RT = yield* _(RealtimeService);
  const config = yield* C.getConfig;
  const org_id = Redacted.value(config.OrgId);
  const brokerUrl = Redacted.value(config.BrokerUrl);
  const prefix = Redacted.value(config.Prefix);
  const x = yield* RT.forPrinter(prefix, org_id);
  const channel = x.subscribe[0];

  const mqtt = yield* _(MQTTService);
  const printer = yield* _(PrinterService);
  yield* Console.log("Starting...", { brokerUrl, org_id, prefix, channel });

  yield* Effect.sleep(1000);

  const client = yield* Effect.acquireRelease(mqtt.connect(brokerUrl), (client, exit) =>
    Effect.sync(() => mqtt.disconnect(client.unsubscribe(channel))),
  );

  yield* mqtt.subscribe(client, channel, async (message) => {
    if (message === "ignore:ping") {
      console.log("Ignoring ping");
      return;
    }
    console.log("Received message", message);

    const printJob = Effect.scoped(
      Effect.gen(function* (_) {
        const device = yield* printer.device();
        yield* printer.print(device, {
          text: [{ content: message }],
        });
      }),
    );

    const exit = await Effect.runPromiseExit(printJob);
    Exit.match(exit, {
      onSuccess: () => console.log("Success"),
      onFailure: (cause) => {
        const causes = Cause.failures(cause);
        const errors = Chunk.toReadonlyArray(causes).map((c) => {
          return `${c._tag}: ${c.message}`;
        });
        const messages = errors.join(", ");
        console.error("Print failed:", messages);
      },
    });
  });
  yield* Console.log("Subscribed to channel", channel);

  const ping = Effect.gen(function* (_) {
    yield* mqtt.publish(client, channel, "ignore:ping");
    yield* mqtt.publish(client, channel, "test");
    // yield* mqtt.publish(client, pingChannel, "ping");
  });

  const schedule = Schedule.spaced("1 seconds");

  yield* Effect.schedule(ping, schedule);

  // Run forever
  return yield* Effect.forever(Effect.void);
}).pipe(
  Effect.provide(MQTTLive),
  Effect.provide(PrinterLive),
  Effect.provide(PrinterConfigLive),
  Effect.provide(RealtimeLive),
);
