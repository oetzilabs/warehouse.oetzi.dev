import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { ScheduleCreateSchema, ScheduleUpdateSchema, TB_schedules } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationId } from "../organizations/id";
import {
  ScheduleInvalidId,
  ScheduleNotCreated,
  ScheduleNotDeleted,
  ScheduleNotFound,
  ScheduleNotUpdated,
} from "./errors";

export class ScheduleService extends Effect.Service<ScheduleService>()("@warehouse/schedules", {
  effect: Effect.gen(function* (_) {
    const database = yield* DatabaseService;
    const db = yield* database.instance;

    const create = Effect.fn("@warehouse/schedules/create")(function* (
      userInput: InferInput<typeof ScheduleCreateSchema>,
    ) {
      const [schedule] = yield* Effect.promise(() => db.insert(TB_schedules).values(userInput).returning());
      if (!schedule) {
        return yield* Effect.fail(new ScheduleNotCreated({}));
      }
      return schedule;
    });

    const findById = Effect.fn("@warehouse/schedules/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new ScheduleInvalidId({ id }));
      }

      const schedule = yield* Effect.promise(() =>
        db.query.TB_schedules.findFirst({
          where: (schedules, operations) => operations.eq(schedules.id, parsedId.output),
          with: {
            customers: {
              with: {
                customer: true,
                order: {
                  with: {
                    products: {
                      with: {
                        product: true,
                      },
                    },
                    sale: {
                      with: {
                        items: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      );

      if (!schedule) {
        return yield* Effect.fail(new ScheduleNotFound({ id }));
      }

      return schedule;
    });

    const update = Effect.fn("@warehouse/schedules/update")(function* (input: InferInput<typeof ScheduleUpdateSchema>) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new ScheduleInvalidId({ id: input.id }));
      }

      const [updated] = yield* Effect.promise(() =>
        db
          .update(TB_schedules)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(TB_schedules.id, parsedId.output))
          .returning(),
      );

      if (!updated) {
        return yield* Effect.fail(new ScheduleNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/schedules/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new ScheduleInvalidId({ id }));
      }

      const [deleted] = yield* Effect.promise(() =>
        db.delete(TB_schedules).where(eq(TB_schedules.id, parsedId.output)).returning(),
      );

      if (!deleted) {
        return yield* Effect.fail(new ScheduleNotDeleted({ id }));
      }

      return deleted;
    });

    const safeRemove = Effect.fn("@warehouse/schedules/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new ScheduleInvalidId({ id }));
      }

      const entries = yield* Effect.promise(() =>
        db.update(TB_schedules).set({ deletedAt: new Date() }).where(eq(TB_schedules.id, parsedId.output)).returning(),
      );

      if (entries.length === 0) {
        return yield* Effect.fail(new ScheduleNotCreated({ message: "Failed to safe remove schedule" }));
      }

      return entries[0];
    });

    const all = Effect.fn("@warehouse/schedules/all")(function* () {
      return yield* Effect.promise(() => db.query.TB_schedules.findMany());
    });

    const findInRange = Effect.fn("@warehouse/schedules/findInRange")(function* (start: Date, end: Date) {
      return yield* Effect.promise(() =>
        db.query.TB_schedules.findMany({
          where: (fields, operations) =>
            operations.and(operations.gte(fields.scheduleStart, start), operations.lte(fields.scheduleEnd, end)),
          with: {
            customers: {
              with: {
                customer: true,
                order: {
                  with: {
                    products: {
                      with: {
                        product: true,
                      },
                    },
                    sale: {
                      with: {
                        items: true,
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

    const findByCustomerId = Effect.fn("@warehouse/schedules/findByCustomerId")(function* (customerId: string) {
      const parsedCustomerId = safeParse(prefixed_cuid2, customerId);
      if (!parsedCustomerId.success) {
        return yield* Effect.fail(new ScheduleInvalidId({ id: customerId }));
      }
      return yield* Effect.promise(() =>
        db.query.TB_customer_schedules.findMany({
          where: (fields, operations) => operations.eq(fields.customerId, parsedCustomerId.output),
          with: {
            schedule: true,
            order: {
              with: {
                products: {
                  with: {
                    product: true,
                  },
                },
                sale: {
                  with: {
                    items: true,
                  },
                },
              },
            },
          },
        }),
      );
    });

    const findByOrderId = Effect.fn("@warehouse/schedules/findByOrderId")(function* (orderId: string) {
      const parsedOrderId = safeParse(prefixed_cuid2, orderId);
      if (!parsedOrderId.success) {
        return yield* Effect.fail(new ScheduleInvalidId({ id: orderId }));
      }
      return yield* Effect.promise(() =>
        db.query.TB_customer_schedules.findMany({
          where: (fields, operations) => operations.eq(fields.orderId, parsedOrderId.output),
          with: {
            schedule: true,
            customer: true,
          },
        }),
      );
    });

    const findByOrganizationId = Effect.fn("@warehouse/schedules/findByOrganizationId")(function* () {
      const orgId = yield* OrganizationId;

      const orders = yield* Effect.promise(() =>
        db.query.TB_customer_orders.findMany({
          where: (fields, operations) => operations.eq(fields.organization_id, orgId),
          with: {
            custSched: {
              with: {
                schedule: {
                  with: {
                    customers: {
                      with: {
                        customer: true,
                        order: {
                          with: {
                            products: {
                              with: {
                                product: true,
                              },
                            },
                            sale: {
                              with: {
                                items: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                customer: true,
              },
            },
          },
        }),
      );
      return Array.from(new Set(orders.flatMap((o) => o.custSched.map((cs) => cs.schedule))));
    });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      all,
      findInRange,
      findByCustomerId,
      findByOrderId,
      findByOrganizationId,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const ScheduleLive = ScheduleService.Default;

// Type exports
export type ScheduleInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<ScheduleService["findById"]>>>>;
