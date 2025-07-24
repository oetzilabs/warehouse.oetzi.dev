#!/usr/bin/env bun
import { CliConfig, Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { BinaryLive } from "@warehouseoetzidev/core/src/entities/binaries";
import { DeviceLive } from "@warehouseoetzidev/core/src/entities/devices";
import { DownloaderLive } from "@warehouseoetzidev/core/src/entities/downloader";
import { InventoryLive } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationLive } from "@warehouseoetzidev/core/src/entities/organizations";
import { WarehouseLive } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Cause, Console, Effect, Layer } from "effect";
import { orgCommand } from "./commands/organization";
import { updateCommand } from "./commands/update";

export const command = Command.make("wh");
export const commands = [updateCommand, orgCommand] as const;

export const cli = Command.run(command.pipe(Command.withSubcommands(commands)), {
  name: "Warehouse CLI",
  version: "0.0.1",
});

const AppLayer = Layer.mergeAll(
  BunContext.layer,
  CliConfig.layer({ showBuiltIns: false, showAllNames: true }),
  OrganizationLive,
  WarehouseLive,
  InventoryLive,
  DeviceLive,
  BinaryLive,
  DownloaderLive,
);

cli(Bun.argv).pipe(
  Effect.catchAllCause((cause) => Console.log(Cause.pretty(cause))),
  Effect.provide(AppLayer),
  BunRuntime.runMain,
);
