import { BunRuntime } from "@effect/platform-bun";
import { Console, Effect } from "effect";
import { DocumentStorageOfferLive, DocumentStorageOfferService } from "./entities/document_storage_offers";
import { PaymentMethodLive, PaymentMethodService } from "./entities/payment_methods";
import { WarehouseTypeLive, WarehouseTypeService } from "./entities/warehouse_types";

const program = Effect.gen(function* (_) {
  const warehouseTypeService = yield* _(WarehouseTypeService);
  const documentStorageOfferService = yield* _(DocumentStorageOfferService);
  const paymentMethodsService = yield* _(PaymentMethodService);
  const warehouseTypes = yield* warehouseTypeService.seed();
  const documentStorageOffers = yield* documentStorageOfferService.seed();
  const paymentMethods = yield* paymentMethodsService.seed();
}).pipe(Effect.provide(WarehouseTypeLive), Effect.provide(DocumentStorageOfferLive), Effect.provide(PaymentMethodLive));

async function run() {
  await Effect.runPromise(program);
}

run().then(() => process.exit(0));
