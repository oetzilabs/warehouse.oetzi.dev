import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { ScheduleCreateSchema, ScheduleUpdateSchema, TB_schedules } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import {
  ScheduleInvalidId,
  ScheduleNotCreated,
  ScheduleNotDeleted,
  ScheduleNotFound,
  ScheduleNotUpdated,
} from "./errors";

export class ScheduleService extends Effect.Service<ScheduleService>()("@warehouse/schedules", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_schedules.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        customers: {
          with: {
            customer: true,
            order: true,
          },
        },
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (userInput: InferInput<typeof ScheduleCreateSchema>) =>
      Effect.gen(function* (_) {
        const [schedule] = yield* Effect.promise(() => db.insert(TB_schedules).values(userInput).returning());
        if (!schedule) {
          return yield* Effect.fail(new ScheduleNotCreated({}));
        }
        return schedule;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
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
                  order: true,
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

    const update = (input: InferInput<typeof ScheduleUpdateSchema>) =>
      Effect.gen(function* (_) {
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

    const remove = (id: string) =>
      Effect.gen(function* (_) {
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

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new ScheduleInvalidId({ id }));
        }

        const entries = yield* Effect.promise(() =>
          db
            .update(TB_schedules)
            .set({ deletedAt: new Date() })
            .where(eq(TB_schedules.id, parsedId.output))
            .returning(),
        );

        if (entries.length === 0) {
          return yield* Effect.fail(new ScheduleNotCreated({ message: "Failed to safe remove schedule" }));
        }

        return entries[0];
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_schedules.findMany());
      });

    const findInRange = (start: Date, end: Date) =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_schedules.findMany({
            where: (fields, operations) =>
              operations.and(operations.gte(fields.scheduleStart, start), operations.lte(fields.scheduleEnd, end)),
            with: {
              customers: {
                with: {
                  customer: true,
                  order: true,
                },
              },
            },
          }),
        );
      });

    const findByCustomerId = (customerId: string) =>
      Effect.gen(function* (_) {
        const parsedCustomerId = safeParse(prefixed_cuid2, customerId);
        if (!parsedCustomerId.success) {
          return yield* Effect.fail(new ScheduleInvalidId({ id: customerId }));
        }
        return yield* Effect.promise(() =>
          db.query.TB_customer_schedules.findMany({
            where: (fields, operations) => operations.eq(fields.customerId, parsedCustomerId.output),
            with: {
              schedule: true,
              order: true,
            },
          }),
        );
      });

    const findByOrderId = (orderId: string) =>
      Effect.gen(function* (_) {
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

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new ScheduleInvalidId({ id: organizationId }));
        }
        const orgSchedules = yield* Effect.promise(() =>
          db.query.TB_organizations_customerorders.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              order: {
                with: {
                  custSched: {
                    with: {
                      schedule: true,
                      customer: true,
                      order: true,
                    },
                  },
                },
              },
            },
          }),
        );
        return orgSchedules.map((o) => o.order.custSched);
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
