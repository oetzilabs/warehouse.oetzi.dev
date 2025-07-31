#!/usr/bin/env bun
import { CliConfig, Command } from "@effect/cli";
import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunPath, BunRuntime } from "@effect/platform-bun";
import { BinaryLive } from "@warehouseoetzidev/core/src/entities/binaries";
import { WarehouseConfigLive } from "@warehouseoetzidev/core/src/entities/config";
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
import packageJson from "../package.json";
import updateCommand from "./commands/update";

const loadCommands = Effect.fn("@warehouse/cli/loadCommands")(function* (names: string[] = [] as string[]) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const skip = ["shared.ts"] as const;
  let files: string[] = [];
  if (names.length === 0) {
    files = yield* fs.readDirectory(path.join(process.cwd(), "src/commands"));
    files = files.filter((f) => !skip.includes(f));
  } else {
    files = names;
  }
  const layers: Layer.Layer.Any[] = [];
  const loaded = yield* Effect.forEach(
    files,
    Effect.fn("@warehouse/cli/loadCommands/forEach")(function* (name) {
      const module = yield* Effect.tryPromise({
        try: () =>
          import(path.join(process.cwd(), "src/commands", name.replace(".ts", ""))) as Promise<{
            default: any;
            layers: Layer.Layer.Any;
          }>,
        catch: (e) => Effect.fail(new Error(`Failed to load command ${name}: ${e}`)),
      });
      const layerCollection = module.layers;
      layers.push(layerCollection);
      return module.default;
    }),
  );
  const tuple = [loaded, layers] as const;
  return yield* Effect.succeed(tuple);
});

export const cli = Effect.fn(function* (commands: string[] = [] as string[]) {
  const [cs, layers] = yield* loadCommands(commands);
  return [
    Command.run(Command.make("wh").pipe(Command.withSubcommands(cs)), {
      name: packageJson.name,
      version: packageJson.version,
    }),
    layers,
  ] as const;
});

const c = Effect.fn(function* (args: string[], commands: string[] = [] as string[]) {
  const [theCommand, layers] = yield* cli(commands);
  return theCommand(args).pipe(
    Effect.catchAllCause((cause) => Console.log(Cause.pretty(cause))),
    Effect.provide(
      Layer.mergeAll(
        BunContext.layer,
        BunPath.layer,
        CliConfig.layer({ showBuiltIns: false, showAllNames: true, finalCheckBuiltIn: false }),
        BinaryLive,
        createOtelLayer("warehouse"),
        ...layers,
      ),
    ),
    BunRuntime.runMain,
  );
});

export default c;

if (import.meta.path === Bun.main) {
  c(Bun.argv, []);
}
