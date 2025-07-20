#!/usr/bin/env bun
import { Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { DeviceLive } from "@warehouseoetzidev/core/src/entities/devices";
import { InventoryLive } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationLive } from "@warehouseoetzidev/core/src/entities/organizations";
import { WarehouseLive } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { command, commands } from "./commands";

export const cli = Command.run(command.pipe(Command.withSubcommands(commands)), {
  name: "Warehouse CLI",
  version: "0.0.1",
});

cli(Bun.argv).pipe(
  Effect.provide([OrganizationLive, WarehouseLive, InventoryLive, DeviceLive, BunContext.layer]),
  BunRuntime.runMain,
);
