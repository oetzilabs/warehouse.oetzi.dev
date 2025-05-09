import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, InferInput, object, parse, safeParse } from "valibot";
import paymentMethods from "../data/payment_methods.json";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import {
  PaymentMethodCreateSchema,
  PaymentMethodType,
  PaymentMethodUpdateSchema,
  TB_payment_methods,
} from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";

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
        return paymentMethod;
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid payment method ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_payment_methods.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: rels,
          }),
        );
      });

    const update = (id: string, input: InferInput<typeof PaymentMethodUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid payment method ID format"));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_payment_methods)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_payment_methods.id, parsedId.output))
            .returning(),
        );
        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid payment method ID format"));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_payment_methods).where(eq(TB_payment_methods.id, parsedId.output)).returning(),
        );
        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid payment method ID format"));
        }

        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_payment_methods)
            .set({ deletedAt: new Date() })
            .where(eq(TB_payment_methods.id, parsedId.output))
            .returning(),
        );
        return deleted;
      });

    const seed = () =>
      Effect.gen(function* (_) {
        yield* Effect.log("Seeding payment methods");
        const methods = yield* Effect.promise(() => db.query.TB_payment_methods.findMany());

        const pms = parse(
          array(
            object({
              ...PaymentMethodCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          paymentMethods,
        );

        const existing = methods.map((v) => v.id);

        const toCreate = pms.filter((t) => !existing.includes(t.id));

        if (toCreate.length > 0) {
          yield* Effect.log("Creating payment methods", toCreate);
          yield* Effect.promise(() => db.insert(TB_payment_methods).values(toCreate).returning());
        }

        const toUpdate = pms.filter((t) => existing.includes(t.id));
        if (toUpdate.length > 0) {
          yield* Effect.log("Updating payment methods", toUpdate);
          for (const method of toUpdate) {
            const updated = yield* Effect.promise(() =>
              db
                .update(TB_payment_methods)
                .set({ ...method, updatedAt: new Date() })
                .where(eq(TB_payment_methods.id, method.id))
                .returning(),
            );
            yield* Effect.log("Updated payment method", updated);
          }
        }

        return pms;
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      seed,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const PaymentMethodLive = PaymentMethodService.Default;
export type PaymentMethodInfo = NonNullable<Effect.Effect.Success<ReturnType<PaymentMethodService["findById"]>>>;
