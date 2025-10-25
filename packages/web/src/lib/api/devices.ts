import { action, json, query } from "@solidjs/router";
import {
  DeviceLive,
  DeviceService,
  type DeviceActions,
  type DeviceHistory,
  type DeviceLogs,
  type DeviceSettings,
  type DeviceTypes,
  type DeviceUpdateInfo,
} from "@warehouseoetzidev/core/src/entities/devices";
import { DeviceNotFound } from "@warehouseoetzidev/core/src/entities/devices/errors";
import { ProductLive, ProductService } from "@warehouseoetzidev/core/src/entities/products";
import { ProductNotFound } from "@warehouseoetzidev/core/src/entities/products/errors";
import { WarehouseLive } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { run } from "./utils";

export const printProductSheet = action((did: string, pid: string) => {
  "use server";
  return run(
    "@action/print-product-sheet",
    Effect.gen(function* () {
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
    undefined,
  );
});

export const getDevices = query(() => {
  "use server";
  return run(
    "@query/get-devices",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      const devices = yield* deviceService.findByOrganizationId();
      return json(devices);
    }).pipe(Effect.provide(WarehouseLive), Effect.provide(DeviceLive)),
    json([]),
  );
}, "get-devices");

export const createDevice = action((data: { name: string; typeId: string }) => {
  "use server";
  return run(
    "@action/create-device",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      const dev = yield* deviceService.create({
        ...data,
        type_id: data.typeId,
      });
      return json(dev);
    }).pipe(Effect.provide(DeviceLive)),
    undefined,
  );
});

export const getDeviceTypes = query(() => {
  "use server";
  return run(
    "@query/get-device-types",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      const types = yield* deviceService.getDeviceTypes();
      return json(types);
    }).pipe(Effect.provide(DeviceLive)),
    json([] as DeviceTypes),
  );
}, "get-device-types");

export const getDeviceById = query(async (id: string) => {
  "use server";
  return run(
    "@query/get-device-by-id",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      const device = yield* deviceService.findById(id);
      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id }));
      }
      return json(
        Object.assign(device, {
          tabs: {
            history: true,
            actions: device.actions.length > 0,
            logs: false,
            terminal: false,
            settings: false,
          },
        }),
      );
    }).pipe(Effect.provide(DeviceLive)),
    undefined,
  );
}, "get-device-by-id");

export const updateDevice = action((data: DeviceUpdateInfo) => {
  "use server";
  return run(
    "@action/update-device",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      return yield* deviceService.update(data);
    }).pipe(Effect.provide(DeviceLive)),
    undefined,
  );
});

export const deleteDevice = action((id: string) => {
  "use server";
  return run(
    "@action/delete-device",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      return yield* deviceService.safeRemove(id);
    }).pipe(Effect.provide(DeviceLive)),
    undefined,
  );
});

export const getDeviceActions = query(async (id: string) => {
  "use server";
  return run(
    "@query/get-device-actions",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      const device = yield* deviceService.findById(id);
      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id }));
      }
      const actions = yield* deviceService.getActions(device.id);
      return json(actions);
    }).pipe(Effect.provide(DeviceLive)),
    json([] as DeviceActions),
  );
}, "get-device-actions");

export const sendDeviceAction = action(async (id: string, action_id: string) => {
  "use server";
  return run(
    "@action/send-device-action",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      const device = yield* deviceService.findById(id);
      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id }));
      }
      const ac = yield* deviceService.sendAction(device.id, action_id);

      return ac;
    }).pipe(Effect.provide(DeviceLive)),
    false,
  );
});

export const getDeviceHistory = query(async (id: string) => {
  "use server";
  return run(
    "@query/get-device-history",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      const device = yield* deviceService.findById(id);
      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id }));
      }
      const deviceHistory = yield* deviceService.getHistory(device.id);
      return json(deviceHistory);
    }).pipe(Effect.provide(DeviceLive)),
    json([] as DeviceHistory),
  );
}, "get-device-history");

export const getDeviceSettings = query(async (id: string) => {
  "use server";
  return run(
    "@query/get-device-settings",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      const device = yield* deviceService.findById(id);
      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id }));
      }
      const deviceSettings = yield* deviceService.getSettings(device.id);
      return json(deviceSettings);
    }).pipe(Effect.provide(DeviceLive)),
    json([] as DeviceSettings),
  );
}, "get-device-settings");

export const getDeviceLogs = query(async (id: string) => {
  "use server";
  return run(
    "@query/get-device-logs",
    Effect.gen(function* () {
      const deviceService = yield* DeviceService;
      const device = yield* deviceService.findById(id);
      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id }));
      }
      const deviceLogs = yield* deviceService
        .getLogs(device.id)
        .pipe(Effect.catchTag("DeviceHasNoConnectionString", (cause) => Effect.succeed([] as string[])));
      return json(deviceLogs);
    }).pipe(Effect.provide(DeviceLive)),
    json([] as DeviceLogs),
  );
}, "get-device-logs");
