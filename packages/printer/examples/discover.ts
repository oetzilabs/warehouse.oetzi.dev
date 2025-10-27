import { BunContext, BunRuntime } from "@effect/platform-bun";
// import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { PrinterLive, PrinterService } from "../src/index.js";

const program = Effect.gen(function* () {
  const printer = yield* PrinterService;
  const disc = yield* printer.discover();
  yield* Console.log(disc);
}).pipe(Effect.provide([PrinterLive, BunContext.layer]));

BunRuntime.runMain(program);
