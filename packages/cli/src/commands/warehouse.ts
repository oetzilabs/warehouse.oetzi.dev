import { Args, Command, Options } from "@effect/cli";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Effect, Layer } from "effect";

dayjs.extend(localizedFormat);

const orgArg = Args.text({ name: "org" }).pipe(Args.withDescription("The org ID"));
// const deviceArg = Args.text({ name: "device" }).pipe(Args.withDescription("The device ID"));

const listWarehouses = Command.make("list", { org: orgArg }).pipe(
  Command.withDescription("List all warehouses for a specific organization"),
  Command.withHandler(({ org }) =>
    Effect.gen(function* () {
      const repo = yield* WarehouseService;
      const warehouses = yield* repo.findByOrganizationId(org);
      if (!warehouses) {
        console.log(`No warehouses found`);
      } else {
        console.log(`Warehouses of org '${org}':`);
        for (const { id, createdAt, name } of warehouses) {
          console.log(`  - ${id}: name ${name} | created at: ${dayjs(createdAt).format("LLL")}`);
        }
      }
    }),
  ),
);

const showWarehouse = Command.make("show", { org: orgArg }).pipe(
  Command.withDescription("Show detailed info for a specific organization"),
  Command.withHandler(({ org }) =>
    Effect.gen(function* () {
      const repo = yield* WarehouseService;
      const warehouse = yield* repo.findById(org);
      if (!warehouse) {
        console.log(`No org found for org: ${org}`);
      } else {
        console.log(`Warehouse for org '${warehouse}':`);
        console.log(
          `  - ${warehouse.id}: name ${warehouse.name} | created at: ${dayjs(warehouse.createdAt).format("LLL")}`,
        );
      }
    }),
  ),
);

export const warehouseCommand = Command.make("warehouse").pipe(
  Command.withSubcommands([listWarehouses, showWarehouse]),
);
