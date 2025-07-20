import { Command } from "@effect/cli";
import { WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Effect } from "effect";
import { orgArg } from "./shared";

dayjs.extend(localizedFormat);

const listWarehouses = Command.make("list", { org: orgArg }).pipe(
  Command.withDescription("List all warehouses for a specific organization"),
  Command.withHandler(
    Effect.fn("@warehouse/cli/org/warehouse.list")(function* ({ org }) {
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
  Command.withHandler(
    Effect.fn("@warehouse/cli/org/warehouse.show")(function* ({ org }) {
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
