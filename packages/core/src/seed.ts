import { Effect } from "effect";
import { DocumentStorageOfferLive, DocumentStorageOfferService } from "./entities/document_storage_offers";
import { OrganizationLive } from "./entities/organizations";
import { PaymentMethodLive, PaymentMethodService } from "./entities/payment_methods";
import { ProductLabelsLive, ProductLabelsService } from "./entities/products/labels";
import { StorageLive, StorageService } from "./entities/storages";
import { UserLive, UserService } from "./entities/users";
import { WarehouseTypeLive, WarehouseTypeService } from "./entities/warehouse_types";
import { WarehouseLive } from "./entities/warehouses";

const program = Effect.gen(function* (_) {
  const warehouseTypeService = yield* _(WarehouseTypeService);
  const documentStorageOfferService = yield* _(DocumentStorageOfferService);
  const userService = yield* _(UserService);
  const paymentMethodsService = yield* _(PaymentMethodService);
  const storageService = yield* _(StorageService);
  const productLabelsService = yield* _(ProductLabelsService);
  const warehouseTypes = yield* warehouseTypeService.seed();
  const documentStorageOffers = yield* documentStorageOfferService.seed();
  const paymentMethods = yield* paymentMethodsService.seed();
  const users = yield* userService.seed();
  const storages = yield* storageService.seed();
  const productLabels = yield* productLabelsService.seed();
}).pipe(
  Effect.provide(StorageLive),
  Effect.provide(WarehouseTypeLive),
  Effect.provide(DocumentStorageOfferLive),
  Effect.provide(PaymentMethodLive),
  Effect.provide(UserLive),
  Effect.provide(OrganizationLive),
  Effect.provide(WarehouseLive),
  Effect.provide(ProductLabelsLive),
);

async function run() {
  await Effect.runPromise(program);
}

run().then(() => process.exit(0));
