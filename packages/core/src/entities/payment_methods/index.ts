import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { PaymentMethodCreateSchema, PaymentMethodUpdateSchema, TB_payment_methods } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import {
  PaymentMethodInvalidId,
  PaymentMethodNotCreated,
  PaymentMethodNotDeleted,
  PaymentMethodNotFound,
  PaymentMethodNotUpdated,
} from "./errors";

export class PaymentMethodService extends Effect.Service<PaymentMethodService>()("@warehouse/payment-methods", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_payment_methods.findMany>[0]>;

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
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (input: InferInput<typeof PaymentMethodCreateSchema>) =>
      Effect.gen(function* (_) {
        const [paymentMethod] = yield* Effect.promise(() => db.insert(TB_payment_methods).values(input).returning());
        if (!paymentMethod) {
          return yield* Effect.fail(new PaymentMethodNotCreated({}));
        }
        return paymentMethod;
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PaymentMethodInvalidId({ id }));
        }

        const method = yield* Effect.promise(() =>
          db.query.TB_payment_methods.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: relations ?? withRelations(),
          }),
        );

        if (!method) {
          return yield* Effect.fail(new PaymentMethodNotFound({ id }));
        }

        return method;
      });

    const update = (id: string, input: InferInput<typeof PaymentMethodUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PaymentMethodInvalidId({ id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_payment_methods)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_payment_methods.id, parsedId.output))
            .returning(),
        );
        if (!updated) {
          return yield* Effect.fail(new PaymentMethodNotUpdated({ id }));
        }
        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PaymentMethodInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_payment_methods).where(eq(TB_payment_methods.id, parsedId.output)).returning(),
        );
        if (!deleted) {
          return yield* Effect.fail(new PaymentMethodNotDeleted({ id }));
        }
        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PaymentMethodInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_payment_methods)
            .set({ deletedAt: new Date() })
            .where(eq(TB_payment_methods.id, parsedId.output))
            .returning(),
        );
        if (!deleted) {
          return yield* Effect.fail(new PaymentMethodNotDeleted({ id }));
        }
        return deleted;
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const PaymentMethodLive = PaymentMethodService.Default;
export type PaymentMethodInfo = NonNullable<Effect.Effect.Success<ReturnType<PaymentMethodService["findById"]>>>;
