import { action, query, redirect } from "@solidjs/router";
import { WarehouseCreateSchema, WarehouseUpdateSchema } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { InferInput } from "valibot";
import { withSession } from "./session";

export const getWarehouseById = query(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      return yield* service.findById(id);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse;
}, "warehouse-by-id");

export const createWarehouse = action(async (data: InferInput<typeof WarehouseCreateSchema>) => {
  "use server";
  const auth = await withSession();

  if (!auth) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const session = auth[1];
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw new Error("You have to be part of an organization to perform this action.");
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      return yield* service.create(data, orgId);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse;
});

export const updateWarehouse = action(async (data: InferInput<typeof WarehouseUpdateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      return yield* service.update(data);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse;
});

export const deleteWarehouse = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      return yield* service.remove(id);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse;
});

export const getWarehousesByOrganization = query(async (organizationId: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const warehouses = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      return yield* service.findByOrganization(organizationId);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouses;
}, "warehouses-by-organization");
