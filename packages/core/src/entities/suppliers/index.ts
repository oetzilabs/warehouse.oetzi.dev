import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import {
  SupplierContactCreateSchema,
  SupplierCreateSchema,
  SupplierNoteCreateSchema,
  SupplierNoteUpdateSchema,
  SupplierUpdateSchema,
  TB_organization_suppliers,
  TB_supplier_contacts,
  TB_supplier_notes,
  TB_suppliers,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId } from "../organizations/errors";
import { OrganizationId } from "../organizations/id";
import { WarehouseInvalidId } from "../warehouses/errors";
import {
  SupplierContactNotCreated,
  SupplierInvalidId,
  SupplierNotCreated,
  SupplierNotDeleted,
  SupplierNoteNotCreated,
  SupplierNoteNotDeleted,
  SupplierNoteNotFound,
  SupplierNoteNotUpdated,
  SupplierNotFound,
  SupplierNotUpdated,
} from "./errors";

export class SupplierService extends Effect.Service<SupplierService>()("@warehouse/suppliers", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (input: InferInput<typeof SupplierCreateSchema>) =>
      Effect.gen(function* (_) {
        const orgId = yield* OrganizationId;
        const [supplier] = yield* Effect.promise(() => db.insert(TB_suppliers).values(input).returning());
        if (!supplier) {
          return yield* Effect.fail(new SupplierNotCreated({}));
        }
        yield* Effect.promise(() =>
          db.insert(TB_organization_suppliers).values({ supplier_id: supplier.id, organization_id: orgId }).returning(),
        );
        return yield* findById(supplier.id);
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id }));
        }
        const orgId = yield* OrganizationId;

        const supplier = yield* Effect.promise(() =>
          db.query.TB_organization_suppliers.findFirst({
            where: (fields, operations) =>
              operations.and(
                operations.eq(fields.supplier_id, parsedId.output),
                operations.eq(fields.organization_id, orgId),
              ),
            with: {
              supplier: {
                with: {
                  products: {
                    with: {
                      product: {
                        with: {
                          labels: true,
                          organizations: true,
                        },
                      },
                    },
                  },
                  contacts: true,
                  notes: {
                    orderBy: (fields, operations) => [
                      operations.desc(fields.updatedAt),
                      operations.desc(fields.createdAt),
                    ],
                  },
                  organizations: true,
                  purchases: {
                    with: {
                      products: {
                        with: {
                          product: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        );

        if (!supplier) {
          return yield* Effect.fail(new SupplierNotFound({ id }));
        }

        return {
          ...supplier.supplier,
          products: supplier.supplier.products.map((p) => ({
            ...p,
            product: {
              ...p.product,
              organizations: p.product.organizations.filter((org) => org.organizationId === orgId),
            },
          })),
        };
      });

    const update = (input: InferInput<typeof SupplierUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_suppliers)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_suppliers.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new SupplierNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const addContact = (supplierId: string, input: InferInput<typeof SupplierContactCreateSchema>) =>
      Effect.gen(function* (_) {
        const supplier = yield* findById(supplierId);
        const [contact] = yield* Effect.promise(() =>
          db
            .insert(TB_supplier_contacts)
            .values({ ...input, supplierId: supplier.id })
            .returning(),
        );

        if (!contact) {
          return yield* Effect.fail(new SupplierContactNotCreated({ supplierId }));
        }

        return contact;
      });

    const addNote = (supplierId: string, input: InferInput<typeof SupplierNoteCreateSchema>) =>
      Effect.gen(function* (_) {
        const supplier = yield* findById(supplierId);
        const [note] = yield* Effect.promise(() =>
          db
            .insert(TB_supplier_notes)
            .values({ ...input, supplierId: supplier.id })
            .returning(),
        );

        if (!note) {
          return yield* Effect.fail(new SupplierNoteNotCreated({ supplierId }));
        }

        return note;
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id: organizationId }));
        }
        const orgSuppliers = yield* Effect.promise(() =>
          db.query.TB_organization_suppliers.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              supplier: {
                with: {
                  contacts: true,
                  notes: true,
                  organizations: true,
                  purchases: {
                    with: {
                      products: true,
                    },
                  },
                },
              },
            },
          }),
        );
        return orgSuppliers.map((orgSupplier) => orgSupplier.supplier);
      });

    const getPurchasesBySupplierId = (supplierId: string) =>
      Effect.gen(function* (_) {
        const parsedSupplierId = safeParse(prefixed_cuid2, supplierId);
        if (!parsedSupplierId.success) {
          return yield* Effect.fail(new SupplierNotFound({ id: supplierId }));
        }
        const orgId = yield* OrganizationId;

        return yield* Effect.promise(() =>
          db.query.TB_supplier_purchases.findMany({
            where: (fields, operations) =>
              operations.and(
                operations.eq(fields.supplier_id, parsedSupplierId.output),
                operations.eq(fields.organization_id, orgId),
              ),
            with: {
              products: {
                with: {
                  product: {
                    with: {
                      labels: true,
                      organizations: {
                        with: {
                          priceHistory: true,
                          tg: {
                            with: {
                              crs: {
                                with: {
                                  tr: true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        );
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id }));
        }
        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_suppliers).where(eq(TB_suppliers.id, parsedId.output)).returning(),
        );
        if (!deleted) {
          return yield* Effect.fail(new SupplierNotDeleted({ id }));
        }
        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id }));
        }
        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_suppliers)
            .set({ deletedAt: new Date() })
            .where(eq(TB_suppliers.id, parsedId.output))
            .returning(),
        );
        if (!deleted) {
          return yield* Effect.fail(new SupplierNotDeleted({ id }));
        }
        return deleted;
      });

    const updateNote = (input: InferInput<typeof SupplierNoteUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id: input.id }));
        }
        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_supplier_notes)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_supplier_notes.id, parsedId.output))
            .returning(),
        );
        if (!updated) {
          return yield* Effect.fail(new SupplierNoteNotUpdated({ id: input.id }));
        }
        return updated;
      });

    const removeNote = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id }));
        }
        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_supplier_notes).where(eq(TB_supplier_notes.id, parsedId.output)).returning(),
        );
        if (!deleted) {
          return yield* Effect.fail(new SupplierNoteNotDeleted({ id }));
        }
        return deleted;
      });

    const findNoteById = (id: string, sid: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id }));
        }
        const parsedSid = safeParse(prefixed_cuid2, sid);
        if (!parsedSid.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id: sid }));
        }
        const note = yield* Effect.promise(() =>
          db.query.TB_supplier_notes.findFirst({
            where: (fields, operations) =>
              operations.and(
                operations.eq(fields.id, parsedId.output),
                operations.eq(fields.supplierId, parsedSid.output),
              ),
            with: {
              supplier: true,
            },
          }),
        );
        if (!note) {
          return yield* Effect.fail(new SupplierNoteNotFound({ id }));
        }
        return note;
      });

    return {
      create,
      findById,
      update,
      addContact,
      addNote,
      updateNote,
      removeNote,
      findNoteById,
      findByOrganizationId,
      remove,
      safeRemove,
      getPurchasesBySupplierId,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const SupplierLive = SupplierService.Default;
export type SupplierInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<SupplierService["findById"]>>>>;
export type SupplierPurchaseInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<SupplierService["getPurchasesBySupplierId"]>>>
>[number];
export type SupplierNoteInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<SupplierService["findNoteById"]>>>>;
