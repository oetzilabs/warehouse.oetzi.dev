import { Effect } from "effect";
import { WarehouseTypeLive, WarehouseTypeService } from "./entities/warehouse_types";

const seed = async () => {
  console.log("Seeding...");
  // TODO: WarehouseTypes seed
  const seeded = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseTypeService);
      return yield* service.seed();
    }).pipe(Effect.provide(WarehouseTypeLive)),
  );
};

seed()
  .then(() => console.log("Seeded"))
  .catch((err) => console.error(err));
process.exit(0);
