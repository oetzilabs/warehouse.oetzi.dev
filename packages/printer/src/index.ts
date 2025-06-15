import { BunRuntime } from "@effect/platform-bun";
import { Config, Effect, Schedule } from "effect";
import { PrinterTypes } from "node-thermal-printer";
import { MQTTLive, MQTTService } from "./services/mqtt";
import { PrinterLive, PrinterService } from "./services/printer";

const program = Effect.gen(function* (_) {
  const org_id = yield* Config.string("ORG_ID");
  const brokerUrl = yield* Config.string("BROKER_URL");
  const channel = `${org_id}/events/devices/printer/message`;
  const pingChannel = `${org_id}/events/devices/printer/ping`;

  const mqtt = yield* _(MQTTService);
  const printer = yield* _(PrinterService);
  yield* Effect.sleep(1000);
  const client = yield* Effect.acquireRelease(mqtt.connect(brokerUrl), (client, exit) =>
    Effect.sync(() => {
      return mqtt.disconnect(client.unsubscribe(channel));
    }),
  );
  // const device = yield* printer.local(PrinterTypes.EPSON, "", 72);
  yield* mqtt.subscribe(client, channel, async (message) => {
    // const isConnected = await device.isPrinterConnected();
    // if (!isConnected) {
    //   return;
    // }
    // device.print(message);
    // await device.execute();
    if (message === "ignore:ping") {
      console.log("Ignoring ping");
      return;
    }
    console.log("Received message", message);
  });
  // Run forever

  const ping = Effect.gen(function* (_) {
    yield* mqtt.publish(client, channel, "ignore:ping");
    yield* mqtt.publish(client, pingChannel, "ping");
  });

  const schedule = Schedule.spaced("60 seconds");

  yield* Effect.schedule(ping, schedule);

  yield* Effect.forever(Effect.void);
}).pipe(Effect.provide(MQTTLive), Effect.provide(PrinterLive));

BunRuntime.runMain(Effect.scoped(program));
