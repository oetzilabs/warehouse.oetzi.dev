import { BunRuntime } from "@effect/platform-bun";
import { Cause, Chunk, Config, Effect, Exit, Redacted, Schedule } from "effect";
import { PrinterTypes } from "node-thermal-printer";
import { PrinterConfig, PrinterConfigLive } from "./config";
import { MQTTLive, MQTTService } from "./services/mqtt";
import { PrinterLive, PrinterService } from "./services/printer";
import { PrinterNotConnected, PrinterNotFound, PrintOperationError } from "./services/printer/errors";

const program = Effect.gen(function* (_) {
  const C = yield* _(PrinterConfig);
  const config = yield* C.getConfig;
  const org_id = Redacted.value(config.OrgId);
  const brokerUrl = Redacted.value(config.BrokerUrl);
  const channel = `${org_id}/events/devices/printer/message`;
  const pingChannel = `${org_id}/events/devices/printer/ping`;

  const mqtt = yield* _(MQTTService);
  const printer = yield* _(PrinterService);

  yield* Effect.sleep(1000);

  const client = yield* Effect.acquireRelease(mqtt.connect(brokerUrl), (client, exit) =>
    Effect.sync(() => mqtt.disconnect(client.unsubscribe(channel))),
  );

  const device = yield* printer.device();
  yield* mqtt.subscribe(client, channel, async (message) => {
    if (message === "ignore:ping") {
      console.log("Ignoring ping");
      return;
    }
    console.log("Received message", message);

    const printJob = Effect.gen(function* (_) {
      yield* printer.print(device, {
        text: [{ content: message }],
      });
    });

    await Effect.runPromise(printJob);
  });
  // Run forever

  const ping = Effect.gen(function* (_) {
    yield* mqtt.publish(client, channel, "ignore:ping");
    yield* mqtt.publish(client, channel, "hello");
    yield* mqtt.publish(client, pingChannel, "ping");
  });

  const schedule = Schedule.spaced("1 seconds");

  yield* Effect.schedule(ping, schedule);

  yield* Effect.forever(Effect.void);
}).pipe(Effect.provide(MQTTLive), Effect.provide(PrinterLive));

BunRuntime.runMain(Effect.scoped(program).pipe(Effect.provide(PrinterConfigLive)));
