#!/usr/bin/env bun
import { Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";

const deviceCommand = Command.make(
  "device",
  {},
  Effect.fn("deviceCommand")(function* () {
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
