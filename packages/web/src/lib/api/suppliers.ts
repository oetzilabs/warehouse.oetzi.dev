import { action, json, query, redirect } from "@solidjs/router";
import {
  SupplierCreateSchema,
  SupplierUpdateSchema,
} from "@warehouseoetzidev/core/src/drizzle/sql/schemas/suppliers/suppliers";
import {
  SupplierNoteCreateSchema,
  SupplierNoteUpdateSchema,
} from "@warehouseoetzidev/core/src/drizzle/sql/schemas/suppliers/suppliers_notes";
import { SupplierLive, SupplierService } from "@warehouseoetzidev/core/src/entities/suppliers";
import { Console, Effect } from "effect";
import { InferInput } from "valibot";
import { getAuthenticatedUser } from "./auth";
import { withSession } from "./session";

export const getSuppliers = query(async () => {
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

  const suppliers = await Effect.runPromise(
    Effect.gen(function* (_) {
      const supplierService = yield* _(SupplierService);
      yield* Console.log({ orgId });
      const suppliers = yield* supplierService.findByOrganizationId(orgId);
      return suppliers;
    }).pipe(Effect.provide(SupplierLive)),
  );
  return suppliers;
}, "suppliers-by-organization");

export const getSupplierById = query(async (id: string) => {
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

  const supplier = await Effect.runPromise(
    Effect.gen(function* (_) {
      const supplierService = yield* _(SupplierService);
      const supplierFromDb = yield* supplierService.findById(id, orgId);
      if (!supplierFromDb) {
        throw redirect(`/suppliers/${id}`, { status: 404, statusText: "Not Found" });
      }

      const supplier = {
        ...supplierFromDb,
        products: supplierFromDb.products.map((p) => ({
          ...p,
          organizations: p.product.organizations.filter((po) => po.organizationId === orgId),
          isInSortiment: p.product.organizations.find((po) => po.organizationId === orgId)?.deletedAt,
        })),
      };
      const purchases = yield* supplierService.getPurchasesBySupplierIdAndOrganizationId(supplier.id, orgId);
      return { supplier, purchases };
    }).pipe(Effect.provide(SupplierLive)),
  );
  return supplier;
}, "supplier-by-id");

export const createSupplier = action(async (data: InferInput<typeof SupplierCreateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!session.current_organization_id) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const supplier = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      return yield* service.create(data, session.current_organization_id!);
    }).pipe(Effect.provide(SupplierLive)),
  );
  return json(supplier, {
    revalidate: [getAuthenticatedUser.key, getSuppliers.key],
    headers: {
      Location: `/suppliers/${supplier.id}`,
    },
    status: 303,
  });
});

export const updateSupplier = action(async (data: InferInput<typeof SupplierUpdateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const supplier = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      return yield* service.update(data);
    }).pipe(Effect.provide(SupplierLive)),
  );
  return supplier;
});

export const deleteSupplier = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const supplier = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      return yield* service.safeRemove(id);
    }).pipe(Effect.provide(SupplierLive)),
  );
  return supplier;
});

export const addNote = action(async (sid: string, data: InferInput<typeof SupplierNoteCreateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const note = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      return yield* service.addNote(sid, orgId, data);
    }).pipe(Effect.provide(SupplierLive)),
  );
  return json(note, {
    revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.keyFor(sid)],
  });
});

export const updateNote = action(async (sid: string, data: InferInput<typeof SupplierUpdateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const note = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      return yield* service.updateNote(data);
    }).pipe(Effect.provide(SupplierLive)),
  );
  return json(note, {
    revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.keyFor(sid)],
  });
});

export const removeNote = action(async (sid: string, id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const note = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      return yield* service.removeNote(id);
    }).pipe(Effect.provide(SupplierLive)),
  );
  return json(note, {
    revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.keyFor(sid)],
  });
});
