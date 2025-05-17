import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { OrderCreateSchema, OrderUpdateSchema, TB_orders } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
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
        whs: {
          with: {
            warehouse: true,
          },
        },
        users: {
          with: {
            user: {
              columns: {
                hashed_password: false,
              },
            },
          },
        },
        products: {
          with: {
            product: true,
          },
        },
        customer: true,
        sale: true,
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
              whs: {
                with: {
                  warehouse: true,
                },
              },
              users: {
                with: {
                  user: {
                    columns: {
                      hashed_password: false,
                    },
                  },
                },
              },
              products: {
                with: {
                  product: true,
                },
              },
              customer: true,
              sale: true,
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

    const findByWarehouseId = (warehouseId: string) =>
      Effect.gen(function* (_) {
        const parsedWarehouseId = safeParse(prefixed_cuid2, warehouseId);
        if (!parsedWarehouseId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id: warehouseId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_warehouse_orders.findMany({
            where: (fields, operations) => operations.eq(fields.warehouseId, parsedWarehouseId.output),
            with: {
              order: {
                with: {
                  whs: {
                    with: {
                      warehouse: true,
                    },
                  },
                  users: {
                    with: {
                      user: {
                        columns: {
                          hashed_password: false,
                        },
                      },
                    },
                  },
                  products: {
                    with: {
                      product: true,
                    },
                  },
                  customer: true,
                  sale: true,
                },
              },
              warehouse: true,
            },
          }),
        );
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByUserId,
      findByWarehouseId,
      all,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const OrderLive = OrderService.Default;

// Type exports
export type OrderInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<OrderService["findById"]>>>>;
