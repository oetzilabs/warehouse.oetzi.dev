import { BunContext, BunRuntime } from "@effect/platform-bun";
// import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { PrinterLive, PrinterService } from "../src/index.js";

const program = Effect.gen(function* () {
  const printer = yield* PrinterService;
  const usb = yield* printer.usb();
  yield* printer.print(usb, {
    text: [
      {
        content: "Hello World",
        font: "a",
        align: "ct",
        style: "bu",
        size: [1, 1],
      },
      {
        content: "Hello World",
        font: "a",
        align: "ct",
        style: "bu",
        size: [1, 1],
      },
      {
        content: "Hello World",
        font: "a",
        align: "ct",
        style: "bu",
        size: [1, 1],
      },
    ],
  });
}).pipe(Effect.scoped, Effect.provide([PrinterLive, BunContext.layer]));

BunRuntime.runMain(program);
