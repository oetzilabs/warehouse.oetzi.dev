import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  CustomerCreateSchema,
  CustomerUpdateSchema,
  TB_customers,
  TB_organization_customers,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId } from "../organizations/errors";
import {
  CustomerInvalidId,
  CustomerNotCreated,
  CustomerNotDeleted,
  CustomerNotFound,
  CustomerNotUpdated,
} from "./errors";

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
      organizations: {
        with: {
          organization: true,
        },
      },
      orders: {
        with: {
          products: {
            with: {
              product: true,
            },
          },
          sale: {
            with: {
              items: {
                with: {
                  product: true,
                },
              },
              warehouse: true,
            },
          },
        },
      },
    });

    const create = (input: InferInput<typeof CustomerCreateSchema>, orgId: string) =>
      Effect.gen(function* (_) {
        const [customer] = yield* Effect.promise(() => db.insert(TB_customers).values(input).returning());
        if (!customer) {
          return yield* Effect.fail(new CustomerNotCreated({}));
        }

        yield* Effect.promise(() =>
          db.insert(TB_organization_customers).values({ customer_id: customer.id, organization_id: orgId }).returning(),
        );

        return yield* findById(customer.id);
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
            with: {
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
              organizations: {
                with: {
                  organization: true,
                },
              },
              orders: {
                with: {
                  products: {
                    with: {
                      product: true,
                    },
                  },
                  sale: {
                    with: {
                      items: {
                        with: {
                          product: true,
                        },
                      },
                      warehouse: true,
                    },
                  },
                },
              },
            },
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

    const update = (input: InferInput<typeof CustomerUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CustomerInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_customers)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_customers.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new CustomerNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const orgCustomers = yield* Effect.promise(() =>
          db.query.TB_organization_customers.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              customer: {
                with: {
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
                  organizations: {
                    with: {
                      organization: true,
                    },
                  },
                  orders: {
                    with: {
                      products: {
                        with: {
                          product: true,
                        },
                      },
                      sale: {
                        with: {
                          items: {
                            with: {
                              product: true,
                            },
                          },
                          warehouse: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        );
        return orgCustomers.map((orgCustomer) => orgCustomer.customer);
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CustomerInvalidId({ id }));
        }
        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_customers).where(eq(TB_customers.id, parsedId.output)).returning(),
        );
        if (!deleted) {
          return yield* Effect.fail(new CustomerNotDeleted({ id }));
        }
        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CustomerInvalidId({ id }));
        }
        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_customers)
            .set({ deletedAt: new Date() })
            .where(eq(TB_customers.id, parsedId.output))
            .returning(),
        );
        if (!deleted) {
          return yield* Effect.fail(new CustomerNotDeleted({ id }));
        }
        return deleted;
      });

    return { create, findById, update, getSalesHistory, findByOrganizationId, remove, safeRemove } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const CustomerLive = CustomerService.Default;
export type CustomerInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<CustomerService["findById"]>>>>;
