import { Command } from "@effect/cli";
import { InventoryService } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect, Layer } from "effect";
import { orgArg } from "./shared";

dayjs.extend(localizedFormat);

export const stockCommand = Command.make("stock", { org: orgArg }).pipe(
  Command.withDescription("Show detailed info for a specific organization"),
  Command.withHandler(
    Effect.fn("@warehouse/cli/stock")(function* ({ org }) {
      const repo = yield* InventoryService;
      const orgId = Layer.succeed(OrganizationId, org);
      const stockStatistics = yield* repo.statistics().pipe(Effect.provide(orgId));
      yield* Console.log("Organization:", org);
      yield* Console.log("Total Capacity:", stockStatistics.capacity);
      yield* Console.log("Total Products:", stockStatistics.products.length);
      yield* Console.log("Total Storages:", stockStatistics.storages.length);
      for (const storage of stockStatistics.storages) {
        yield* Console.log(`  - ${storage.name} (${storage.id}):`);
        yield* Console.log(`    Status: ${storage.status}`);
        yield* Console.log(`    Capacity: ${storage.capacity}`);
        yield* Console.log(`    Products: ${storage.productsCount}`);
        yield* Console.table(
          storage.productSummary.map((p) => ({ ...p.product, quantity: p.count })),
          ["id", "name", "barcode", "quantity"],
        );
      }
    }),
  ),
);
