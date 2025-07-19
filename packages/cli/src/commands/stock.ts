import { Command } from "@effect/cli";
import { InventoryService } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Effect, Layer } from "effect";
import { orgArg } from "./shared";

dayjs.extend(localizedFormat);

export const stockCommand = Command.make("stock", { org: orgArg }).pipe(
  Command.withDescription("Show detailed info for a specific organization"),
  Command.withHandler(({ org }) =>
    Effect.gen(function* () {
      const repo = yield* InventoryService;
      const orgId = Layer.succeed(OrganizationId, org);
      const stockStatistics = yield* repo.statistics().pipe(Effect.provide(orgId));
      console.log("Organization:", org);
      console.log("Total Capacity:", stockStatistics.capacity);
      console.log("Total Products:", stockStatistics.products.length);
      console.log("Total Storages:", stockStatistics.storages.length);
      for (const storage of stockStatistics.storages) {
        console.log(`  - ${storage.name} (${storage.id}):`);
        console.log(`    Products: ${storage.productsCount}`);
        for (const product of storage.productSummary) {
          console.log(`      - ${product.product.name} (${product.product.id}): ${product.count}`);
        }
        console.log(`    Capacity: ${storage.capacity}`);
        console.log(`    Children Capacity: ${storage.childrenCapacity}`);
        console.log(`    Status: ${storage.status}`);
      }
    }),
  ),
);
