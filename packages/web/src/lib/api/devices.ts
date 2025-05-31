import { action, json, query, redirect } from "@solidjs/router";
import { DeviceLive, DeviceService } from "@warehouseoetzidev/core/src/entities/devices";
import { DeviceNotFound } from "@warehouseoetzidev/core/src/entities/devices/errors";
import { ProductLive, ProductService } from "@warehouseoetzidev/core/src/entities/products";
import { ProductNotDeleted, ProductNotFound } from "@warehouseoetzidev/core/src/entities/products/errors";
import { ProductLabelsLive, ProductLabelsService } from "@warehouseoetzidev/core/src/entities/products/labels";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { WarehouseNotFound } from "@warehouseoetzidev/core/src/entities/warehouses/errors";
import { Cause, Chunk, Effect, Exit } from "effect";
import { withSession } from "./session";

export const printProductSheet = action(async (whid: string, did: string, pid: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const program = Effect.gen(function* (_) {
    const productService = yield* _(ProductService);
    const whService = yield* _(WarehouseService);
    const deviceService = yield* _(DeviceService);
    const wh = yield* whService.findById(whid);
    if (!wh) {
      return yield* Effect.fail(new WarehouseNotFound({ id: whid }));
    }
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
  }).pipe(Effect.provide(ProductLive), Effect.provide(WarehouseLive), Effect.provide(DeviceLive));

  const productExit = await Effect.runPromiseExit(program);

  return Exit.match(productExit, {
    onSuccess: (prods) => {
      return json(prods);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
});

export const getDevicesByWarehouseId = query(async (whid: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const device = await Effect.runPromise(
    Effect.gen(function* (_) {
      const deviceService = yield* _(DeviceService);
      const whService = yield* _(WarehouseService);
      const wh = yield* whService.findById(whid);
      if (!wh) {
        return yield* Effect.fail(new WarehouseNotFound({ id: whid }));
      }
      const devices = yield* deviceService.findByWarehouseId(wh.id);
      return devices;
    }).pipe(Effect.provide(WarehouseLive), Effect.provide(DeviceLive)),
  );
  return device;
}, "devices-by-warehouse-id");

export const getDevices = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  if (!session.current_organization_id) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const devices = await Effect.runPromise(
    Effect.gen(function* (_) {
      const deviceService = yield* _(DeviceService);
      const devices = yield* deviceService.findByOrganizationId(session.current_organization_id!);
      return devices;
    }).pipe(Effect.provide(WarehouseLive), Effect.provide(DeviceLive)),
  );
  return devices;
}, "get-devices");

export const createDevice = action(async (data: { name: string; type: string }) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const fcid = session.current_warehouse_facility_id;
  if (!fcid) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const device = await Effect.runPromise(
    Effect.gen(function* (_) {
      const deviceService = yield* _(DeviceService);
      return yield* deviceService.create({
        ...data,
        facility_id: fcid,
      });
    }).pipe(Effect.provide(DeviceLive)),
  );

  return device;
});
