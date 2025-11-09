#!/usr/bin/env bun
import { Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect } from "effect";

const deviceCommand = Command.make(
  "device",
  {},
  Effect.fn("deviceCommand")(function* () {
    yield* Console.log("Device command is currently empty - architecture needs to be rethought");
    return Effect.void;
  }),
);

const cli = Command.run(deviceCommand, {
  name: "wh",
  version: "1.0.0",
});

if (import.meta.path === Bun.main) {
  cli(Bun.argv).pipe(Effect.provide([BunContext.layer]), BunRuntime.runMain);
}
