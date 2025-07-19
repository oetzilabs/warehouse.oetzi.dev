#!/usr/bin/env bun
import { Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { OrganizationLive } from "@warehouseoetzidev/core/src/entities/organizations";
import { Effect } from "effect";
import { commands } from "./commands";

const command = Command.make("wh").pipe(Command.withSubcommands(commands));

export const cli = Command.run(command, {
  name: "Warehouse CLI",
  version: "0.0.1",
});

cli(process.argv).pipe(Effect.provide([OrganizationLive, BunContext.layer]), BunRuntime.runMain);
