import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { OrderCreateSchema, OrderUpdateSchema, TB_orders } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId } from "../organizations/errors";
import { WarehouseInvalidId } from "../warehouses/errors";
import {
  OrderInvalidId,
  OrderNotCreated,
  OrderNotDeleted,
  OrderNotFound,
  OrderNotUpdated,
  OrderUserInvalidId,
  OrderWarehouseInvalidId,
} from "./errors";

export class OrderService extends Effect.Service<OrderService>()("@warehouse/orders", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_orders.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        users: {
          with: {
            user: {
              columns: {
                hashed_password: false,
              },
            },
          },
        },
        prods: {
          with: {
            product: true,
          },
        },
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (userInput: InferInput<typeof OrderCreateSchema>) =>
      Effect.gen(function* (_) {
        const [order] = yield* Effect.promise(() => db.insert(TB_orders).values(userInput).returning());
        if (!order) {
          return yield* Effect.fail(new OrderNotCreated({}));
        }
        return order;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id }));
        }

        const order = yield* Effect.promise(() =>
          db.query.TB_orders.findFirst({
            where: (orders, operations) => operations.eq(orders.id, parsedId.output),
            with: {
              users: {
                with: {
                  user: {
                    columns: {
                      hashed_password: false,
                    },
                  },
                },
              },
              prods: {
                with: {
                  product: true,
                },
              },
            },
          }),
        );

        if (!order) {
          return yield* Effect.fail(new OrderNotFound({ id }));
        }

        return order;
      });

    const update = (input: InferInput<typeof OrderUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_orders)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_orders.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new OrderNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_orders).where(eq(TB_orders.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new OrderNotDeleted({ id }));
        }

        return deleted;
      });

    const findByUserId = (userId: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new OrderUserInvalidId({ userId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_user_orders.findMany({
            where: (fields, operations) => operations.eq(fields.userId, parsedUserId.output),
            with: {
              order: {
                with: relations,
              },
            },
          }),
        );
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.update(TB_orders).set({ deletedAt: new Date() }).where(eq(TB_orders.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new OrderNotCreated({ message: "Failed to safe remove order" }));
        }

        return deleted;
      });

    const all = (relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_orders.findMany({ with: relations }));
      });

    const findCustomerOrdersByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const orgOrders = yield* Effect.promise(() =>
          db.query.TB_organizations_customerorders.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              order: {
                with: {
                  users: {
                    with: {
                      user: {
                        columns: {
                          hashed_password: false,
                        },
                      },
                    },
                  },
                  prods: {
                    with: {
                      product: true,
                    },
                  },
                },
              },
            },
          }),
        );
        return orgOrders.map((o) => o.order);
      });

    const findSupplierOrdersByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const orgOrders = yield* Effect.promise(() =>
          db.query.TB_organizations_supplierorders.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              order: {
                with: {
                  users: {
                    with: {
                      user: {
                        columns: {
                          hashed_password: false,
                        },
                      },
                    },
                  },
                  prods: {
                    with: {
                      product: true,
                    },
                  },
                },
              },
            },
          }),
        );
        return orgOrders.map((o) => o.order);
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByUserId,
      findCustomerOrdersByOrganizationId,
      findSupplierOrdersByOrganizationId,
      all,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const OrderLive = OrderService.Default;

// Type exports
export type OrderInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<OrderService["findById"]>>>>;
