import { BunRuntime } from "@effect/platform-bun";
import { Console, Effect } from "effect";
import { DocumentStorageOfferLive, DocumentStorageOfferService } from "./entities/document_storage_offers";
import { WarehouseTypeLive, WarehouseTypeService } from "./entities/warehouse_types";

const program = Effect.gen(function* (_) {
  const warehouseTypeService = yield* _(WarehouseTypeService);
  const documentStorageOfferService = yield* _(DocumentStorageOfferService);
  const warehouseTypes = yield* warehouseTypeService.seed();
  const documentStorageOffers = yield* documentStorageOfferService.seed();
}).pipe(Effect.provide(WarehouseTypeLive), Effect.provide(DocumentStorageOfferLive));

async function run() {
  await Effect.runPromise(program);
  process.exit(0);
}

run();
