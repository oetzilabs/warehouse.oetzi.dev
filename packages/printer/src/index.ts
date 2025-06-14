import { BunRuntime } from "@effect/platform-bun";
import { Config, Effect } from "effect";
import { PrinterTypes } from "node-thermal-printer";
import { MQTTLive, MQTTService } from "./services/mqtt";
import { PrinterLive, PrinterService } from "./services/printer";

const program = Effect.gen(function* (_) {
  const org_id = yield* Config.string("ORG_ID");
  const brokerUrl = yield* Config.string("BROKER_URL");
  const channel = `${org_id}/events/printer`;

  const mqtt = yield* _(MQTTService);
  const printer = yield* _(PrinterService);
  yield* Effect.sleep(1000);
  // const device = yield* printer.local(PrinterTypes.EPSON, "", 72);
  yield* mqtt.connect(brokerUrl);
  yield* mqtt.subscribe(channel, async (message) => {
    // const isConnected = await device.isPrinterConnected();
    // if (!isConnected) {
    //   return;
    // }
    // device.print(message);
    // await device.execute();
    console.log(message);
  });
  yield* mqtt.disconnect();
}).pipe(Effect.provide(MQTTLive), Effect.provide(PrinterLive));

BunRuntime.runMain(program);
