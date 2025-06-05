import { query, redirect } from "@solidjs/router";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { withSession } from "./session";

export const getInventory = query(async () => {
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
    if (!user.has_finished_onboarding) {
      return redirect("/onboarding");
    }
    throw new Error("You have to be part of an organization to perform this action.");
  }
  const inventory = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(OrganizationService);
      const info = yield* service.getInventory(orgId);
      return info;
    }).pipe(Effect.provide(OrganizationLive)),
  );
  return inventory;
}, "organization-inventory");

export const getInventoryMetadata = query(async () => {
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
  const whId = session.current_warehouse_id;
  if (!whId) {
    if (!user.has_finished_onboarding) {
      return redirect("/onboarding");
    }
    throw new Error("You have to be part of an warehouse to perform this action.");
  }
  const warehouse_inventory = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      const info = yield* service.getInventoryInfo(whId);
      return info;
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse_inventory;
}, "warehouse-inventory-metadata");
