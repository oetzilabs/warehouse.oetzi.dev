import { action, json, query } from "@solidjs/router";
import {
  SupplierCreateSchema,
  SupplierUpdateSchema,
} from "@warehouseoetzidev/core/src/drizzle/sql/schemas/suppliers/suppliers";
import { SupplierNoteCreateSchema } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/suppliers/suppliers_notes";
import { SupplierLive, SupplierService } from "@warehouseoetzidev/core/src/entities/suppliers";
import { Effect } from "effect";
import { InferInput } from "valibot";
import { getAuthenticatedUser } from "./auth";
import { run } from "./utils";

export const getSuppliers = query(() => {
  "use server";
  return run(
    "@query/suppliers",
    Effect.gen(function* (_) {
      const supplierService = yield* SupplierService;
      const suppliers = yield* supplierService.findByOrganizationId();
      return suppliers;
    }).pipe(Effect.provide(SupplierLive)),
    json([]),
  );
}, "suppliers-by-organization");

export const getSupplierById = query(async (id: string) => {
  "use server";
  return run(
    "@query/supplier-by-id",
    Effect.gen(function* (_) {
      const supplierService = yield* SupplierService;
      const supplierFromDb = yield* supplierService.findById(id);

      const purchases = yield* supplierService.getPurchasesBySupplierId(supplierFromDb.id);
      return { supplier: supplierFromDb, purchases };
    }).pipe(Effect.provide(SupplierLive)),
    json(undefined),
  );
}, "supplier-by-id");

export const createSupplier = action(async (data: InferInput<typeof SupplierCreateSchema>) => {
  "use server";
  return run(
    "@action/create-supplier",
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      const supplier = yield* service.create(data);
      return json(supplier, {
        revalidate: [getAuthenticatedUser.key, getSuppliers.key],
        headers: {
          Location: `/suppliers/${supplier.id}`,
        },
        status: 303,
      });
    }).pipe(Effect.provide(SupplierLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getSuppliers.key],
    }),
  );
});

export const updateSupplier = action(async (data: InferInput<typeof SupplierUpdateSchema>) => {
  "use server";
  return run(
    "@action/update-supplier",
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      const updated = yield* service.update(data);
      return json(updated, {
        revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.keyFor(updated.id)],
      });
    }).pipe(Effect.provide(SupplierLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.key],
    }),
  );
});

export const deleteSupplier = action(async (id: string) => {
  "use server";
  return run(
    "@action/delete-supplier",
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      const deleted = yield* service.safeRemove(id);
      return json(deleted, {
        revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.keyFor(deleted.id)],
        headers: {
          Location: `/suppliers/`,
        },
      });
    }).pipe(Effect.provide(SupplierLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.key],
    }),
  );
});

export const addNote = action(async (sid: string, data: InferInput<typeof SupplierNoteCreateSchema>) => {
  "use server";
  return run(
    "@action/add-note",
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      const note = yield* service.addNote(sid, data);
      return json(note, {
        revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.keyFor(sid)],
      });
    }).pipe(Effect.provide(SupplierLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.key],
    }),
  );
});

export const updateNote = action(async (sid: string, data: InferInput<typeof SupplierUpdateSchema>) => {
  "use server";
  return run(
    "@action/update-note",
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      const note = yield* service.updateNote(data);
      return json(note, {
        revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.keyFor(sid)],
      });
    }).pipe(Effect.provide(SupplierLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.key],
    }),
  );
});

export const removeNote = action(async (sid: string, id: string) => {
  "use server";
  return run(
    "@action/remove-note",
    Effect.gen(function* (_) {
      const service = yield* _(SupplierService);
      const note = yield* service.removeNote(id);
      return json(note, {
        revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.keyFor(sid)],
      });
    }).pipe(Effect.provide(SupplierLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getSuppliers.key, getSupplierById.key],
    }),
  );
});
