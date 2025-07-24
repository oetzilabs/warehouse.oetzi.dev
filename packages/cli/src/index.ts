#!/usr/bin/env bun
import { Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { BinaryLive } from "@warehouseoetzidev/core/src/entities/binaries";
import { DeviceLive } from "@warehouseoetzidev/core/src/entities/devices";
import { DownloaderLive } from "@warehouseoetzidev/core/src/entities/downloader";
import { InventoryLive } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationLive } from "@warehouseoetzidev/core/src/entities/organizations";
import { WarehouseLive } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Cause, Console, Effect } from "effect";
import { orgCommand } from "./commands/organization";
import { updateCommand } from "./commands/update";

export const command = Command.make("wh");
export const commands = [updateCommand, orgCommand] as const;

export const cli = Command.run(command.pipe(Command.withSubcommands(commands)), {
  name: "Warehouse CLI",
  version: "0.0.1",
});

cli(Bun.argv).pipe(
  Effect.catchAllCause((cause) => Console.log(Cause.pretty(cause))),
  Effect.provide([
    OrganizationLive,
    WarehouseLive,
    InventoryLive,
    DeviceLive,
    BinaryLive,
    DownloaderLive,
    BunContext.layer,
  ]),
  BunRuntime.runMain,
);
