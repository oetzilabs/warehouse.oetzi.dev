import { Effect } from "effect";
import { WarehouseTypeLive, WarehouseTypeService } from "./entities/warehouse_types";

export {};

const seed = async () => {
  // TODO: WarehouseTypes seed
  const seeded = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseTypeService);
      return yield* service.seed();
    }).pipe(Effect.provide(WarehouseTypeLive)),
  );
};

await seed();
