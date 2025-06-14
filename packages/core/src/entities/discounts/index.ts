import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DiscountV1CreateSchema, DiscountV1UpdateSchema, TB_discounts_v1 } from "../../drizzle/sql/schemas/discounts";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId } from "../organizations/errors";
import {
  DiscountInvalidId,
  DiscountNotCreated,
  DiscountNotDeleted,
  DiscountNotFound,
  DiscountNotUpdated,
  OrganizationNoDiscounts,
} from "./errors";

export class DiscountService extends Effect.Service<DiscountService>()("@warehouse/discounts", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (input: InferInput<typeof DiscountV1CreateSchema>) =>
      Effect.gen(function* (_) {
        const [discount] = yield* Effect.promise(() => db.insert(TB_discounts_v1).values(input).returning());

        if (!discount) {
          return yield* Effect.fail(new DiscountNotCreated({}));
        }

        return discount;
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DiscountInvalidId({ id }));
        }

        const discount = yield* Effect.promise(() =>
          db.query.TB_discounts_v1.findFirst({
            where: (discounts, { eq }) => eq(discounts.id, parsedId.output),
          }),
        );

        if (!discount) {
          return yield* Effect.fail(new DiscountNotFound({ id }));
        }

        return discount;
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const discounts = yield* Effect.promise(() =>
          db.query.TB_organization_discounts.findMany({
            where: (fields, { eq }) => eq(fields.organization_id, organizationId),
            with: {
              discount: true,
            },
          }),
        );

        // if (discounts.length === 0) {
        //   return yield* Effect.fail(new OrganizationNoDiscounts({ id: organizationId }));
        // }

        return discounts.map((d) => d.discount);
      });

    const update = (input: InferInput<typeof DiscountV1UpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DiscountInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_discounts_v1)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_discounts_v1.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new DiscountNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DiscountInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_discounts_v1).where(eq(TB_discounts_v1.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new DiscountNotDeleted({ id }));
        }

        return deleted;
      });

    return {
      create,
      findById,
      findByOrganizationId,
      update,
      remove,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const DiscountLive = DiscountService.Default;

export type DiscountInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<DiscountService["findById"]>>>>;
