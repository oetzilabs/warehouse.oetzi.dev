import { action, json, query } from "@solidjs/router";
import { DeviceLive, DeviceService, DeviceUpdateInfo } from "@warehouseoetzidev/core/src/entities/devices";
import { DeviceNotFound } from "@warehouseoetzidev/core/src/entities/devices/errors";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
import { ProductLive, ProductService } from "@warehouseoetzidev/core/src/entities/products";
import { ProductNotFound } from "@warehouseoetzidev/core/src/entities/products/errors";
import { WarehouseLive } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { run } from "./utils";

export const printProductSheet = action((did: string, pid: string) => {
  "use server";
  return run(
    "@action/print-product-sheet",
    Effect.gen(function* (_) {
      const productService = yield* ProductService;
      const deviceService = yield* DeviceService;
      const product = yield* productService.findById(pid);
      if (!product) {
        return yield* Effect.fail(new ProductNotFound({ id: pid }));
      }
      const device = yield* deviceService.findById(did);
      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id: pid }));
      }

      const result = yield* productService.printProductSheet(device, product);

      return result;
    }).pipe(Effect.provide(ProductLive), Effect.provide(DeviceLive)),
    json(undefined),
  );
});

export const getDevices = query(() => {
  "use server";
  return run(
    "@query/get-devices",
    Effect.gen(function* (_) {
      const deviceService = yield* DeviceService;
      return yield* deviceService.findByOrganizationId();
    }).pipe(Effect.provide(WarehouseLive), Effect.provide(DeviceLive)),
    json([]),
  );
}, "get-devices");

export const createDevice = action((data: { name: string; typeId: string }) => {
  "use server";
  return run(
    "@action/create-device",
    Effect.gen(function* (_) {
      const deviceService = yield* DeviceService;
      return yield* deviceService.create({
        ...data,
        type_id: data.typeId,
      });
    }).pipe(Effect.provide(DeviceLive)),
    json(undefined),
  );
});

export const getDeviceTypes = query(() => {
  "use server";
  return run(
    "@query/get-device-types",
    Effect.gen(function* (_) {
      const deviceService = yield* _(DeviceService);
      return yield* deviceService.getDeviceTypes();
    }).pipe(Effect.provide(DeviceLive)),
    json([]),
  );
}, "get-device-types");

export const getDeviceById = query(async (id: string) => {
  "use server";
  return run(
    "@query/get-device-by-id",
    Effect.gen(function* (_) {
      const deviceService = yield* _(DeviceService);
      const device = yield* deviceService.findById(id);
      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id }));
      }
      return device;
    }).pipe(Effect.provide(DeviceLive)),
    json([]),
  );
}, "get-device-by-id");

export const updateDevice = action((data: DeviceUpdateInfo) => {
  "use server";
  return run(
    "@action/update-device",
    Effect.gen(function* (_) {
      const deviceService = yield* _(DeviceService);
      return yield* deviceService.update(data);
    }).pipe(Effect.provide(DeviceLive)),
    json(undefined),
  );
});

export const deleteDevice = action((id: string) => {
  "use server";
  return run(
    "@action/delete-device",
    Effect.gen(function* (_) {
      const deviceService = yield* _(DeviceService);
      return yield* deviceService.safeRemove(id);
    }).pipe(Effect.provide(DeviceLive)),
    json(undefined),
  );
});
