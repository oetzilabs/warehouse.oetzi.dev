import { Cause, Chunk, Effect, Exit } from "effect";
import { flatten } from "valibot";
import { BrandLive, BrandService } from "./entities/brands";
import { DeviceLive, DeviceService } from "./entities/devices";
import { DocumentStorageOfferLive, DocumentStorageOfferService } from "./entities/document_storage_offers";
import { OrganizationLive } from "./entities/organizations";
import { PaymentMethodLive, PaymentMethodService } from "./entities/payment_methods";
import { ProductLive, ProductService } from "./entities/products";
import { ProductInvalidJson } from "./entities/products/errors";
import { ProductLabelsLive, ProductLabelsService } from "./entities/products/labels";
import { StorageLive, StorageService } from "./entities/storages";
import { UserLive, UserService } from "./entities/users";
import { WarehouseTypeLive, WarehouseTypeService } from "./entities/warehouse_types";
import { WarehouseLive } from "./entities/warehouses";

const program = Effect.gen(function* (_) {
  //services
  const warehouseTypeService = yield* _(WarehouseTypeService);
  const documentStorageOfferService = yield* _(DocumentStorageOfferService);
  const userService = yield* _(UserService);
  const paymentMethodsService = yield* _(PaymentMethodService);
  const storageService = yield* _(StorageService);
  const productLabelsService = yield* _(ProductLabelsService);
  const brandService = yield* _(BrandService);
  const productService = yield* _(ProductService);
  const deviceService = yield* _(DeviceService);

  // seeding
  const products = yield* productService.seed();
  const warehouseTypes = yield* warehouseTypeService.seed();
  const documentStorageOffers = yield* documentStorageOfferService.seed();
  const paymentMethods = yield* paymentMethodsService.seed();
  const users = yield* userService.seed();
  const storages = yield* storageService.seed();
  const productLabels = yield* productLabelsService.seed();
  const brands = yield* brandService.seed();
  const devices = yield* deviceService.seed();
}).pipe(
  Effect.provide(StorageLive),
  Effect.provide(WarehouseTypeLive),
  Effect.provide(DocumentStorageOfferLive),
  Effect.provide(PaymentMethodLive),
  Effect.provide(UserLive),
  Effect.provide(OrganizationLive),
  Effect.provide(WarehouseLive),
  Effect.provide(BrandLive),
  Effect.provide(ProductLabelsLive),
  Effect.provide(ProductLive),
  Effect.provide(DeviceLive),
);

async function run() {
  const exit = await Effect.runPromiseExit(program);
  return Exit.match(exit, {
    onSuccess: () => process.exit(0),
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        if (c instanceof ProductInvalidJson) {
          return `Invalid product json: ${c.issues.map((i: any) => `${i.path.map((p: any) => p.key).join(":")}: ${i.message}`).join(", ")}`;
        }
        // return c.message;
      });
      console.log(errors.join(", "));
      process.exit(1);
    },
  });
}

run();
