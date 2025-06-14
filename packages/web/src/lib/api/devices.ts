import { action, json, query, redirect } from "@solidjs/router";
import { DeviceInfo, DeviceLive, DeviceService, DeviceUpdateInfo } from "@warehouseoetzidev/core/src/entities/devices";
import { DeviceNotFound } from "@warehouseoetzidev/core/src/entities/devices/errors";
import { PrinterLive, PrinterService } from "@warehouseoetzidev/core/src/entities/printer";
import { ProductLive, ProductService } from "@warehouseoetzidev/core/src/entities/products";
import { ProductNotDeleted, ProductNotFound } from "@warehouseoetzidev/core/src/entities/products/errors";
import { ProductLabelsLive, ProductLabelsService } from "@warehouseoetzidev/core/src/entities/products/labels";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { WarehouseNotFound } from "@warehouseoetzidev/core/src/entities/warehouses/errors";
import { Cause, Chunk, Effect, Exit } from "effect";
import { withSession } from "./session";

export const printProductSheet = action(async (did: string, pid: string) => {
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
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const program = Effect.gen(function* (_) {
    const productService = yield* _(ProductService);
    const deviceService = yield* _(DeviceService);
    const product = yield* productService.findById(pid, orgId);
    if (!product) {
      return yield* Effect.fail(new ProductNotFound({ id: pid }));
    }
    const device = yield* deviceService.findById(did);
    if (!device) {
      return yield* Effect.fail(new DeviceNotFound({ id: pid }));
    }

    const result = yield* productService.printProductSheet(device, product);

    return result;
  }).pipe(Effect.provide(ProductLive), Effect.provide(DeviceLive));

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

export const createDevice = action(async (data: { name: string; typeId: string }) => {
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
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const device = await Effect.runPromise(
    Effect.gen(function* (_) {
      const deviceService = yield* _(DeviceService);
      return yield* deviceService.create({
        ...data,
        type_id: data.typeId,
        organization_id: orgId,
      });
    }).pipe(Effect.provide(DeviceLive)),
  );

  return device;
});

export const getDeviceTypes = query(async () => {
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

  const deviceTypes = await Effect.runPromise(
    Effect.gen(function* (_) {
      const deviceService = yield* _(DeviceService);
      return yield* deviceService.getDeviceTypes();
    }).pipe(Effect.provide(DeviceLive)),
  );
  return deviceTypes;
}, "get-device-types");

export const getDeviceById = query(async (id: string) => {
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
      const device = yield* deviceService.findById(id);
      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id }));
      }
      return device;
    }).pipe(Effect.provide(DeviceLive)),
  );
  return device;
}, "get-device-by-id");

export const updateDevice = action(async (data: DeviceUpdateInfo) => {
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
      return yield* deviceService.update(data);
    }).pipe(Effect.provide(DeviceLive)),
  );
  return device;
});

export const deleteDevice = action(async (id: string) => {
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
      return yield* deviceService.safeRemove(id);
    }).pipe(Effect.provide(DeviceLive)),
  );
  return device;
});

export const populateLocal = action(async () => {
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
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const device = await Effect.runPromise(
    Effect.gen(function* (_) {
      const deviceService = yield* _(PrinterService);
      return yield* deviceService.populateLocal(orgId);
    }).pipe(Effect.provide(PrinterLive)),
  );
  return device;
});
