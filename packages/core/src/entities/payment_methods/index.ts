import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { PaymentMethodCreateSchema, PaymentMethodUpdateSchema, TB_payment_methods } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
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
    const db = yield* DatabaseService;

    const create = (input: InferInput<typeof PaymentMethodCreateSchema>) =>
      Effect.gen(function* (_) {
        const [paymentMethod] = yield* db.insert(TB_payment_methods).values(input).returning();
        if (!paymentMethod) {
          return yield* Effect.fail(new PaymentMethodNotCreated({}));
        }
        return paymentMethod;
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PaymentMethodInvalidId({ id }));
        }

        const method = yield* db.query.TB_payment_methods.findFirst({
          where: (fields, operations) => operations.eq(fields.id, parsedId.output),
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
          },
        });

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

        const [updated] = yield* db
          .update(TB_payment_methods)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(TB_payment_methods.id, parsedId.output))
          .returning();
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

        const [deleted] = yield* db
          .delete(TB_payment_methods)
          .where(eq(TB_payment_methods.id, parsedId.output))
          .returning();
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

        const [deleted] = yield* db
          .update(TB_payment_methods)
          .set({ deletedAt: new Date() })
          .where(eq(TB_payment_methods.id, parsedId.output))
          .returning();
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
