import { action, json, query, redirect } from "@solidjs/router";
import { StorageLive, StorageService } from "@warehouseoetzidev/core/src/entities/storages";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { getAuthenticatedUser } from "./auth";
import { getInventory } from "./inventory";
import { withSession } from "./session";
import { run } from "./utils";

export const getStorages = query(async (areaId: string) => {
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

  const warehouse_storages = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* StorageService;
      const storages = yield* service.findByAreaId(areaId);
      return storages;
    }).pipe(Effect.provide(StorageLive)),
  );
  return warehouse_storages;
}, "warehouse-storages");

export const getStorageTypes = query(async () => {
  "use server";
  return run(
    "@query/storages/get-types",
    Effect.gen(function* (_) {
      const service = yield* StorageService;
      const types = yield* service.getTypes();
      return json(types);
    }).pipe(Effect.provide(StorageLive)),
    json(
      [] as {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date | null;
        deletedAt: Date | null;
        code: string;
      }[],
    ),
  );
}, "storage-types");

export const addStorage = action(
  (data: {
    name: string;
    typeId: string;
    warehouseAreaId: string;
    description: string;
    bounding_box: {
      x: number;
      y: number;
      width: number;
      height: number;
      depth: number;
    };
    capacity: number;
    barcode: string;
  }) => {
    "use server";
    return run(
      "@action/storages/add",
      Effect.gen(function* (_) {
        const storageService = yield* StorageService;
        // based on the width, height and depth, determine the variant
        const variant = (data.bounding_box.width > data.bounding_box.height ? "horizontal" : "vertical") as
          | "horizontal"
          | "vertical";
        const createdStorage = yield* storageService.create({ ...data, variant });

        return json(true, {
          revalidate: [getAuthenticatedUser.key, getInventory.key],
          headers: {
            Location: `/storages/${createdStorage.id}`,
          },
        });
      }).pipe(Effect.provide([StorageLive])),
      json(false, {
        revalidate: [getAuthenticatedUser.key, getInventory.key],
        headers: {
          Location: "/storages",
        },
      }),
    );
  },
);

export const generateBarcode = action(() => {
  "use server";
  return run(
    "@action/storages/generate-barcode",
    Effect.gen(function* (_) {
      const service = yield* StorageService;
      const barcode = yield* service.generateBarcode();
      return json({ barcode });
    }).pipe(Effect.provide(StorageLive)),
    json({ barcode: "" }),
  );
});
