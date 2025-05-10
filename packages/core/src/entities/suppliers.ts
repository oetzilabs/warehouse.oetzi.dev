import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import {
  SupplierContactCreateSchema,
  SupplierCreateSchema,
  SupplierNoteCreateSchema,
  SupplierUpdateSchema,
  TB_supplier_contacts,
  TB_supplier_notes,
  TB_suppliers,
} from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";

export class SupplierService extends Effect.Service<SupplierService>()("@warehouse/suppliers", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_suppliers.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        contacts: true,
        notes: true,
        products: true,
      };
      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (input: InferInput<typeof SupplierCreateSchema>) =>
      Effect.gen(function* (_) {
        const [supplier] = yield* Effect.promise(() => db.insert(TB_suppliers).values(input).returning());
        return findById(supplier.id);
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) return yield* Effect.fail(new Error("Invalid supplier ID"));
        return yield* Effect.promise(() =>
          db.query.TB_suppliers.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: rels,
          }),
        );
      });

    const addContact = (supplierId: string, input: InferInput<typeof SupplierContactCreateSchema>) =>
      Effect.gen(function* (_) {
        const supplier = yield* findById(supplierId);
        if (!supplier) return yield* Effect.fail(new Error("Supplier not found"));
        const [contact] = yield* Effect.promise(() =>
          db
            .insert(TB_supplier_contacts)
            .values({ ...input, supplierId: supplier.id })
            .returning(),
        );
        return contact;
      });

    const addNote = (supplierId: string, input: InferInput<typeof SupplierNoteCreateSchema>) =>
      Effect.gen(function* (_) {
        const supplier = yield* findById(supplierId);
        if (!supplier) return yield* Effect.fail(new Error("Supplier not found"));
        const [note] = yield* Effect.promise(() =>
          db
            .insert(TB_supplier_notes)
            .values({ ...input, supplierId: supplier.id })
            .returning(),
        );
        return note;
      });

    return { create, findById, addContact, addNote } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const SupplierLive = SupplierService.Default;
