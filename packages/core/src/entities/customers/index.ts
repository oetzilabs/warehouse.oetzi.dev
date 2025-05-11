import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { CustomerCreateSchema, CustomerUpdateSchema, TB_customers } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { CustomerInvalidId, CustomerNotCreated, CustomerNotFound } from "./errors";

export class CustomerService extends Effect.Service<CustomerService>()("@warehouse/customers", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_customers.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => ({
      sales: {
        with: {
          items: {
            with: {
              product: true,
            },
          },
          warehouse: true,
        },
      },
    });

    const create = (input: InferInput<typeof CustomerCreateSchema>) =>
      Effect.gen(function* (_) {
        const [customer] = yield* Effect.promise(() => db.insert(TB_customers).values(input).returning());
        if (!customer) {
          return yield* Effect.fail(new CustomerNotCreated({}));
        }
        return findById(customer.id);
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CustomerInvalidId({ id }));
        }

        const customer = yield* Effect.promise(() =>
          db.query.TB_customers.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: rels,
          }),
        );

        if (!customer) {
          return yield* Effect.fail(new CustomerNotFound({ id }));
        }

        return customer;
      });

    const getSalesHistory = (id: string) =>
      Effect.gen(function* (_) {
        const customer = yield* findById(id);
        return customer.sales;
      });

    return { create, findById, getSalesHistory } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const CustomerLive = CustomerService.Default;
