#!/usr/bin/env bun
import { CliConfig, Command } from "@effect/cli";
import { BunContext, BunPath, BunRuntime } from "@effect/platform-bun";
import { BinaryLive } from "@warehouseoetzidev/core/src/entities/binaries";
import { WarehouseConfigLive } from "@warehouseoetzidev/core/src/entities/config";
import { DeviceLive } from "@warehouseoetzidev/core/src/entities/devices";
import { DownloaderLive } from "@warehouseoetzidev/core/src/entities/downloader";
import { FacilityLive } from "@warehouseoetzidev/core/src/entities/facilities";
import { InventoryLive } from "@warehouseoetzidev/core/src/entities/inventory";
import { MessagingLive } from "@warehouseoetzidev/core/src/entities/messaging";
import { CustomerOrderLive } from "@warehouseoetzidev/core/src/entities/orders";
import { OrganizationLive } from "@warehouseoetzidev/core/src/entities/organizations";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
import { ProductLive } from "@warehouseoetzidev/core/src/entities/products";
import { StorageLive } from "@warehouseoetzidev/core/src/entities/storages";
import { SupplierLive } from "@warehouseoetzidev/core/src/entities/suppliers";
import { UserLive } from "@warehouseoetzidev/core/src/entities/users";
import { WarehouseLive } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Cause, Console, Effect, Layer } from "effect";
import { devicesCommand } from "./commands/device";
import { orderCommand } from "./commands/order";
import { orgCommand } from "./commands/organization";
import { productCommand } from "./commands/product";
import { stockCommand } from "./commands/stock";
import { supplierCommand } from "./commands/suppliers";
import { testCommand } from "./commands/tests";
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
      orderCommand,
      testCommand,
      productCommand,
    ]),
  ),
  {
    name: "Warehouse CLI",
    version: "0.0.1",
  },
);

const AppLayer = Layer.mergeAll(
  BunContext.layer,
  BunPath.layer,
  CliConfig.layer({ showBuiltIns: false, showAllNames: true }),
  OrganizationLive,
  UserLive,
  SupplierLive,
  WarehouseLive,
  CustomerOrderLive,
  InventoryLive,
  StorageLive,
  ProductLive,
  MessagingLive,
  FacilityLive,
  DeviceLive,
  BinaryLive,
  DownloaderLive,
  WarehouseConfigLive,
  createOtelLayer("warehouse"),
);

cli(Bun.argv).pipe(
  Effect.catchAllCause((cause) => Console.log(Cause.pretty(cause))),
  Effect.provide(AppLayer),
  BunRuntime.runMain,
);
