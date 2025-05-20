import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  SupplierContactCreateSchema,
  SupplierCreateSchema,
  SupplierNoteCreateSchema,
  SupplierUpdateSchema,
  TB_supplier_contacts,
  TB_supplier_notes,
  TB_suppliers,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { WarehouseInvalidId } from "../warehouses/errors";
import {
  SupplierContactNotCreated,
  SupplierInvalidId,
  SupplierNotCreated,
  SupplierNoteNotCreated,
  SupplierNotFound,
} from "./errors";

export class SupplierService extends Effect.Service<SupplierService>()("@warehouse/suppliers", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_suppliers.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        contacts: true,
        notes: true,
        products: {
          with: {
            product: {
              with: {
                labels: true,
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

    const create = (input: InferInput<typeof SupplierCreateSchema>) =>
      Effect.gen(function* (_) {
        const [supplier] = yield* Effect.promise(() => db.insert(TB_suppliers).values(input).returning());
        if (!supplier) {
          return yield* Effect.fail(new SupplierNotCreated({}));
        }
        return findById(supplier.id);
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
            with: rels,
          }),
        );

        if (!supplier) {
          return yield* Effect.fail(new SupplierNotFound({ id }));
        }

        return supplier;
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

    const findByWarehouseId = (warehouseId: string) =>
      Effect.gen(function* (_) {
        const parsedWarehouseId = safeParse(prefixed_cuid2, warehouseId);
        if (!parsedWarehouseId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id: warehouseId }));
        }
        return yield* Effect.promise(() =>
          db.query.TB_warehouse_suppliers.findMany({
            where: (fields, operations) => operations.eq(fields.warehouse_id, parsedWarehouseId.output),
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
                },
              },
            },
          }),
        );
      });

    return { create, findById, addContact, addNote, findByWarehouseId } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const SupplierLive = SupplierService.Default;
