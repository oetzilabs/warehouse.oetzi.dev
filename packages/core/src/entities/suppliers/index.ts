import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  SupplierContactCreateSchema,
  SupplierCreateSchema,
  SupplierNoteCreateSchema,
  SupplierUpdateSchema,
  TB_organization_suppliers,
  TB_supplier_contacts,
  TB_supplier_notes,
  TB_suppliers,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId } from "../organizations/errors";
import { WarehouseInvalidId } from "../warehouses/errors";
import {
  SupplierContactNotCreated,
  SupplierInvalidId,
  SupplierNotCreated,
  SupplierNotDeleted,
  SupplierNoteNotCreated,
  SupplierNotFound,
  SupplierNotUpdated,
} from "./errors";

export class SupplierService extends Effect.Service<SupplierService>()("@warehouse/suppliers", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_suppliers.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        products: {
          with: {
            product: {
              with: {
                labels: true,
              },
            },
          },
        },
        contacts: true,
        notes: true,
        organizations: true,
        orgOrders: {
          with: {
            order: {
              with: {
                prods: {
                  with: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      };
      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (input: InferInput<typeof SupplierCreateSchema>, orgId: string) =>
      Effect.gen(function* (_) {
        const [supplier] = yield* Effect.promise(() => db.insert(TB_suppliers).values(input).returning());
        if (!supplier) {
          return yield* Effect.fail(new SupplierNotCreated({}));
        }
        yield* Effect.promise(() =>
          db.insert(TB_organization_suppliers).values({ supplier_id: supplier.id, organization_id: orgId }).returning(),
        );
        return yield* findById(supplier.id);
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id }));
        }

        const supplier = yield* Effect.promise(() =>
          db.query.TB_suppliers.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: {
              products: {
                with: {
                  product: {
                    with: {
                      labels: true,
                    },
                  },
                },
              },
              contacts: true,
              notes: {
                orderBy: (fields, operations) => [operations.desc(fields.updatedAt), operations.desc(fields.createdAt)],
              },
              organizations: true,
              orgOrders: {
                with: {
                  order: {
                    with: {
                      prods: {
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

        return supplier;
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
                  products: {
                    with: {
                      product: {
                        with: {
                          labels: true,
                        },
                      },
                    },
                  },
                  contacts: true,
                  notes: true,
                  organizations: true,
                  orgOrders: {
                    with: {
                      order: {
                        with: {
                          prods: {
                            with: {
                              product: true,
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
        return orgSuppliers.map((orgSupplier) => orgSupplier.supplier);
      });

    const getOrdersBySupplierIdAndOrganizationId = (supplierId: string, organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedSupplierId = safeParse(prefixed_cuid2, supplierId);
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedSupplierId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id: supplierId }));
        }
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        return yield* Effect.promise(() =>
          db.query.TB_organizations_supplierorders.findMany({
            where: (fields, operations) =>
              operations.and(
                operations.eq(fields.supplier_id, parsedSupplierId.output),
                operations.eq(fields.organization_id, parsedOrganizationId.output),
              ),
            with: {
              order: {
                with: {
                  prods: {
                    with: {
                      product: {
                        with: {
                          labels: true,
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

    return {
      create,
      findById,
      update,
      addContact,
      addNote,
      findByOrganizationId,
      remove,
      safeRemove,
      getOrdersBySupplierIdAndOrganizationId,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const SupplierLive = SupplierService.Default;
export type SupplierInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<SupplierService["findById"]>>>>;
export type SupplierOrderInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<SupplierService["getOrdersBySupplierIdAndOrganizationId"]>>>
>[number]["order"];
