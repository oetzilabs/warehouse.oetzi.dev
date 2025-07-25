#!/usr/bin/env bun
import { CliConfig, Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { BinaryLive } from "@warehouseoetzidev/core/src/entities/binaries";
import { DeviceLive } from "@warehouseoetzidev/core/src/entities/devices";
import { DownloaderLive } from "@warehouseoetzidev/core/src/entities/downloader";
import { InventoryLive } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationLive } from "@warehouseoetzidev/core/src/entities/organizations";
import { SupplierLive } from "@warehouseoetzidev/core/src/entities/suppliers";
import { UserLive } from "@warehouseoetzidev/core/src/entities/users";
import { WarehouseLive } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Cause, Console, Effect, Layer } from "effect";
import { devicesCommand } from "./commands/device";
import { orgCommand } from "./commands/organization";
import { stockCommand } from "./commands/stock";
import { supplierCommand } from "./commands/suppliers";
import { updateCommand } from "./commands/update";
import { userCommand } from "./commands/users";
import { warehouseCommand } from "./commands/warehouse";

export const cli = Command.run(
  Command.make("wh").pipe(
    Command.withSubcommands([
      updateCommand,
      orgCommand,
      warehouseCommand,
      stockCommand,
      devicesCommand,
      userCommand,
      supplierCommand,
    ]),
  ),
  {
    name: "Warehouse CLI",
    version: "0.0.1",
  },
);

const AppLayer = Layer.mergeAll(
  BunContext.layer,
  CliConfig.layer({ showBuiltIns: false, showAllNames: true }),
  OrganizationLive,
  UserLive,
  SupplierLive,
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
