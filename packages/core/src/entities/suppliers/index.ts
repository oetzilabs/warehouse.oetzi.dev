import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { Effect, Schema } from "effect";
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

export const SupplierFindBySchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  contact: Schema.optional(Schema.String),
  note: Schema.optional(Schema.String),
  active: Schema.optional(Schema.Boolean),
  blacklisted: Schema.optional(Schema.Boolean),
});

export class SupplierService extends Effect.Service<SupplierService>()("@warehouse/suppliers", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;

    const create = Effect.fn("@warehouse/suppliers/create")(function* (input: InferInput<typeof SupplierCreateSchema>) {
      const orgId = yield* OrganizationId;
      const [supplier] = yield* db.insert(TB_suppliers).values(input).returning();
      if (!supplier) {
        return yield* Effect.fail(new SupplierNotCreated({}));
      }
      yield* db
        .insert(TB_organization_suppliers)
        .values({ supplier_id: supplier.id, organization_id: orgId })
        .returning();
      return yield* findById(supplier.id);
    });

    const findById = Effect.fn("@warehouse/suppliers/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id }));
      }
      const orgId = yield* OrganizationId;

      const supplier = yield* db.query.TB_organization_suppliers.findFirst({
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
                orderBy: (fields, operations) => [operations.desc(fields.updatedAt), operations.desc(fields.createdAt)],
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
      });

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
            isInSortiment: p.product.organizations.find((org) => org.organizationId === orgId)?.deletedAt,
          },
          isInSortiment: p.product.organizations.find((org) => org.organizationId === orgId)?.deletedAt,
        })),
      };
    });

    const findByIdWithoutOrg = Effect.fn("@warehouse/suppliers/findByIdWithoutOrg")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id }));
      }
      const supplier = yield* db.query.TB_suppliers.findFirst({
        where: (fields, operations) => operations.eq(fields.id, parsedId.output),
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
            orderBy: (fields, operations) => [operations.desc(fields.updatedAt), operations.desc(fields.createdAt)],
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
      });

      if (!supplier) {
        return yield* Effect.fail(new SupplierNotFound({ id }));
      }

      return supplier;
    });

    const update = Effect.fn("@warehouse/suppliers/update")(function* (input: InferInput<typeof SupplierUpdateSchema>) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_suppliers)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_suppliers.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new SupplierNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const addContact = Effect.fn("@warehouse/suppliers/addContact")(function* (
      supplierId: string,
      input: InferInput<typeof SupplierContactCreateSchema>,
    ) {
      const supplier = yield* findById(supplierId);
      const [contact] = yield* db
        .insert(TB_supplier_contacts)
        .values({ ...input, supplierId: supplier.id })
        .returning();

      if (!contact) {
        return yield* Effect.fail(new SupplierContactNotCreated({ supplierId }));
      }

      return contact;
    });

    const addNote = Effect.fn("@warehouse/suppliers/addNote")(function* (
      supplierId: string,
      input: InferInput<typeof SupplierNoteCreateSchema>,
    ) {
      const supplier = yield* findById(supplierId);
      const [note] = yield* db
        .insert(TB_supplier_notes)
        .values({ ...input, supplierId: supplier.id })
        .returning();

      if (!note) {
        return yield* Effect.fail(new SupplierNoteNotCreated({ supplierId }));
      }

      return note;
    });

    const findByOrganizationId = Effect.fn("@warehouse/suppliers/findByOrganizationId")(function* () {
      const orgId = yield* OrganizationId;
      const orgSuppliers = yield* db.query.TB_organization_suppliers.findMany({
        where: (fields, operations) => operations.eq(fields.organization_id, orgId),
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
      });
      return orgSuppliers.map((orgSupplier) => orgSupplier.supplier);
    });

    const getPurchasesBySupplierId = Effect.fn("@warehouse/suppliers/getPurchasesBySupplierId")(function* (
      supplierId: string,
    ) {
      const parsedSupplierId = safeParse(prefixed_cuid2, supplierId);
      if (!parsedSupplierId.success) {
        return yield* Effect.fail(new SupplierNotFound({ id: supplierId }));
      }
      const orgId = yield* OrganizationId;
      const x = yield* db.query.TB_supplier_purchases.findMany({
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
      });
      return x.map((x) => ({
        ...x,
        products: x.products.map((p) => ({
          ...p,
          product: {
            ...p.product,
            organizations: p.product.organizations.filter((org) => org.organizationId === orgId),
            priceHistory:
              p.product.organizations
                .find((o) => o.organizationId === orgId)
                ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime()) || [],
            currency: p.product.organizations
              .find((org) => org.organizationId === orgId)!
              .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].currency,
            sellingPrice: p.product.organizations
              .find((org) => org.organizationId === orgId)!
              .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].sellingPrice,
          },
        })),
      }));
    });

    const remove = Effect.fn("@warehouse/suppliers/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id }));
      }
      const [deleted] = yield* db.delete(TB_suppliers).where(eq(TB_suppliers.id, parsedId.output)).returning();
      if (!deleted) {
        return yield* Effect.fail(new SupplierNotDeleted({ id }));
      }
      return deleted;
    });

    const safeRemove = Effect.fn("@warehouse/suppliers/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id }));
      }
      const [deleted] = yield* db
        .update(TB_suppliers)
        .set({ deletedAt: new Date() })
        .where(eq(TB_suppliers.id, parsedId.output))
        .returning();
      if (!deleted) {
        return yield* Effect.fail(new SupplierNotDeleted({ id }));
      }
      return deleted;
    });

    const updateNote = Effect.fn("@warehouse/suppliers/updateNote")(function* (
      input: InferInput<typeof SupplierNoteUpdateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id: input.id }));
      }
      const [updated] = yield* db
        .update(TB_supplier_notes)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_supplier_notes.id, parsedId.output))
        .returning();
      if (!updated) {
        return yield* Effect.fail(new SupplierNoteNotUpdated({ id: input.id }));
      }
      return updated;
    });

    const removeNote = Effect.fn("@warehouse/suppliers/removeNote")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id }));
      }
      const [deleted] = yield* db
        .delete(TB_supplier_notes)
        .where(eq(TB_supplier_notes.id, parsedId.output))
        .returning();
      if (!deleted) {
        return yield* Effect.fail(new SupplierNoteNotDeleted({ id }));
      }
      return deleted;
    });

    const findNoteById = Effect.fn("@warehouse/suppliers/findNoteById")(function* (id: string, sid: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id }));
      }
      const parsedSid = safeParse(prefixed_cuid2, sid);
      if (!parsedSid.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id: sid }));
      }
      const note = yield* db.query.TB_supplier_notes.findFirst({
        where: (fields, operations) =>
          operations.and(operations.eq(fields.id, parsedId.output), operations.eq(fields.supplierId, parsedSid.output)),
        with: {
          supplier: true,
        },
      });
      if (!note) {
        return yield* Effect.fail(new SupplierNoteNotFound({ id }));
      }
      return note;
    });

    const getPurchases = Effect.fn("@warehouse/suppliers/getPurchases")(function* () {
      const orgId = yield* OrganizationId;
      const suppliers = yield* db.query.TB_organization_suppliers.findMany({
        where: (fields, operations) => operations.eq(fields.organization_id, orgId),
        with: {
          supplier: {
            with: {
              products: {
                with: {
                  priceHistory: true,
                },
              },
              purchases: {
                with: {
                  products: true,
                },
              },
            },
          },
        },
      });
      const s = suppliers.map((supplier) => supplier.supplier);

      const products = s.flatMap((supplier) => supplier.products);
      const purchases = s.flatMap((supplier) => supplier.purchases);
      // for each purchase, match each product with its latest priceHistory (by effectiveDate). use the `products` array to find the matching product.
      return purchases
        .flatMap((purchase) =>
          purchase.products.map((prod) => {
            const sp = products.find((sp) => sp.productId === prod.productId)!;

            // Find the latest priceHistory entry (by effectiveDate)
            const priceHistorySorted = sp.priceHistory.toSorted(
              (a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime(),
            );
            const latestPrice = priceHistorySorted[0];
            return {
              name: prod.productId,
              value: latestPrice ? latestPrice.supplierPrice * Math.abs(prod.quantity) : 0,
              currency: latestPrice ? latestPrice.currency : "USD",
              date: purchase.updatedAt ?? purchase.createdAt,
              metadata: {
                purchaseId: purchase.id,
                quantity: prod.quantity,
                createdAt: purchase.createdAt,
              },
            };
          }),
        )
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
    });

    const all = Effect.fn("@warehouse/suppliers/all")(function* () {
      return yield* db.query.TB_suppliers.findMany({
        with: {
          contacts: true,
          notes: true,
          purchases: {
            with: {
              products: true,
            },
          },
        },
      });
    });

    const findBy = Effect.fn("@warehouse/suppliers/findBy")(function* (filter: typeof SupplierFindBySchema.Type) {
      let suppliers = yield* db.query.TB_suppliers.findMany({
        where: (fields, operations) => {
          const collector = [];
          if (filter.name) {
            collector.push(operations.ilike(fields.name, `%${filter.name}%`));
          }
          if (filter.email) {
            collector.push(operations.ilike(fields.email, `%${filter.email}%`));
          }
          if (filter.active !== undefined) {
            if (filter.active) {
              collector.push(operations.eq(fields.status, "active"));
            } else {
              collector.push(operations.eq(fields.status, "inactive"));
            }
          }
          if (filter.blacklisted) {
            collector.push(operations.eq(fields.status, "blacklisted"));
          }
          return operations.or(...collector);
        },
        with: {
          contacts: true,
          notes: true,
          purchases: {
            with: {
              products: true,
            },
          },
        },
      });
      if (filter.contact !== undefined) {
        const contact = filter.contact!.toLowerCase();
        suppliers = suppliers.filter((supplier) =>
          supplier.contacts.find(
            (c) =>
              c.id === contact ||
              c.name.toLowerCase().includes(contact.toLowerCase()) ||
              (c.email?.toLowerCase().includes(contact.toLowerCase()) ?? false) ||
              (c.phone?.toLowerCase().includes(contact.toLowerCase()) ?? false) ||
              (c.position?.toLowerCase().includes(contact.toLowerCase()) ?? false),
          ),
        );
      }
      if (filter.note !== undefined) {
        const note = filter.note!.toLowerCase();
        suppliers = suppliers.filter((supplier) =>
          supplier.notes.find(
            (n) =>
              n.id === note ||
              n.title.toLowerCase().includes(note.toLowerCase()) ||
              n.content.toLowerCase().includes(note),
          ),
        );
      }
      return suppliers;
    });

    return {
      all,
      create,
      findById,
      findByIdWithoutOrg,
      findBy,
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
      getPurchases,
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
