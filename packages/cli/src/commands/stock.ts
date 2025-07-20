import { Args, Command } from "@effect/cli";
import { InventoryService } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect, Layer } from "effect";
import { orgArg } from "./shared";

dayjs.extend(localizedFormat);

const storageArg = Args.text({ name: "storage" }).pipe(Args.withDescription("The storage ID"));

const stockCmd = Command.make(
  "stock",
  { org: orgArg },
  Effect.fn("@warehouse/cli/stock.show")(function* ({ org }) {
    const repo = yield* InventoryService;
    const orgId = Layer.succeed(OrganizationId, org);
    const stats = yield* repo.statistics().pipe(Effect.provide(orgId));
    yield* Console.log("Organization:", org);
    yield* Console.log("Total Capacity:", stats.capacity);
    yield* Console.log("Total Products:", stats.products.length);
    yield* Console.log("Total Storages:", stats.storages.length);
    for (const storage of stats.storages) {
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
);

export const stockCommand = stockCmd;
// .pipe(
// Command.withSubcommands([
// Command.make("show", { org: orgArg }, () => Effect.void),
// Command.make("show", { stock: storageArg }, ({ wh }) =>
//   Effect.flatMap(
//     stockCmd,
//     Effect.fn("@warehouse/cli/wh.show")(function* ({ org }) {
//       const repo = yield* InventoryService;
//       const organization = yield* repo.findById(wh);
//       console.log(`Organization for org '${organization}':`);
//       console.log(
//         `  - ${organization.id}: name ${organization.name} | created at: ${dayjs(organization.createdAt).format("LLL")}`,
//       );
//     }),
//   ),
// ),
// ]),
// );
