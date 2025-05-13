import { query, redirect } from "@solidjs/router";
import { StorageLive, StorageService } from "@warehouseoetzidev/core/src/entities/storages";
import { Effect } from "effect";
import { withSession } from "./session";

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
      const service = yield* _(StorageService);
      const storages = yield* service.findByAreaId(areaId);
      return storages;
    }).pipe(Effect.provide(StorageLive)),
  );
  return warehouse_storages;
}, "warehouse-storages");
