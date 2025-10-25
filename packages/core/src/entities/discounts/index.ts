import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DiscountV1CreateSchema, DiscountV1UpdateSchema, TB_discounts_v1 } from "../../drizzle/sql/schemas/discounts";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrderInvalidId } from "../orders/errors";
import { OrganizationInvalidId } from "../organizations/errors";
import { ProductInvalidId } from "../products/errors";
import {
  DiscountInvalidId,
  DiscountNotCreated,
  DiscountNotDeleted,
  DiscountNotFound,
  DiscountNotUpdated,
  OrganizationNoDiscounts,
} from "./errors";

export class DiscountService extends Effect.Service<DiscountService>()("@warehouse/discounts", {
  effect: Effect.gen(function* () {
    const db = yield* DatabaseService;

    const create = Effect.fn("@warehouse/discounts/create")(function* (
      input: InferInput<typeof DiscountV1CreateSchema>,
    ) {
      const [discount] = yield* db.insert(TB_discounts_v1).values(input).returning();

      if (!discount) {
        return yield* Effect.fail(new DiscountNotCreated({}));
      }

      return discount;
    });

    const findById = Effect.fn("@warehouse/discounts/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new DiscountInvalidId({ id }));
      }

      const discount = yield* db.query.TB_discounts_v1.findFirst({
        where: (discounts, { eq }) => eq(discounts.id, parsedId.output),
      });

      if (!discount) {
        return yield* Effect.fail(new DiscountNotFound({ id }));
      }

      return discount;
    });

    const findByOrganizationId = Effect.fn("@warehouse/discounts/findByOrganizationId")(function* (
      organizationId: string,
    ) {
      const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
      if (!parsedOrganizationId.success) {
        return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
      }

      const discounts = yield* db.query.TB_organization_discounts.findMany({
        where: (fields, { eq }) => eq(fields.organization_id, organizationId),
        with: {
          discount: true,
        },
      });

      // if (discounts.length === 0) {
      //   return yield* Effect.fail(new OrganizationNoDiscounts({ id: organizationId }));
      // }

      return discounts.map((d) => d.discount);
    });

    const update = Effect.fn("@warehouse/discounts/update")(function* (
      input: InferInput<typeof DiscountV1UpdateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new DiscountInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_discounts_v1)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_discounts_v1.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new DiscountNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/dscounts/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new DiscountInvalidId({ id }));
      }

      const [deleted] = yield* db.delete(TB_discounts_v1).where(eq(TB_discounts_v1.id, parsedId.output)).returning();

      if (!deleted) {
        return yield* Effect.fail(new DiscountNotDeleted({ id }));
      }

      return deleted;
    });

    const safeRemove = Effect.fn("@warehouse/discounts/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new DiscountInvalidId({ id }));
      }

      const [deleted] = yield* db
        .update(TB_discounts_v1)
        .set({ deletedAt: new Date() })
        .where(eq(TB_discounts_v1.id, parsedId.output))
        .returning();

      if (!deleted) {
        return yield* Effect.fail(new DiscountNotDeleted({ id }));
      }

      return deleted;
    });

    const findByOrderId = Effect.fn("@warehouse/discounts/findByOrderId")(function* (orderId: string) {
      const parsedOrderId = safeParse(prefixed_cuid2, orderId);
      if (!parsedOrderId.success) {
        return yield* Effect.fail(new OrderInvalidId({ id: orderId }));
      }

      // check the sales discounts
      const salesDiscounts = yield* db.query.TB_sales_discounts.findMany({
        where: (fields, operations) => operations.eq(fields.saleId, parsedOrderId.output),
        with: {
          discount: true,
        },
      });
      return salesDiscounts;
    });

    const findByOrderIdAndProductId = Effect.fn("@warehouse/discounts/findByOrderIdAndProductId")(function* (
      orderId: string,
      productId: string,
    ) {
      const parsedOrderId = safeParse(prefixed_cuid2, orderId);
      if (!parsedOrderId.success) {
        return yield* Effect.fail(new OrderInvalidId({ id: orderId }));
      }

      const parsedProductId = safeParse(prefixed_cuid2, productId);
      if (!parsedProductId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }

      // check the sales discounts
      const salesDiscounts = yield* db.query.TB_sales_discounts.findMany({
        where: (fields, operations) =>
          operations.and(
            operations.eq(fields.saleId, parsedOrderId.output),
            operations.eq(fields.productId, parsedProductId.output),
          ),
        with: {
          discount: true,
        },
      });
      return salesDiscounts;
    });

    const findGlobalDiscounts = Effect.fn("@warehouse/discounts/findGlobalDiscounts")(function* () {
      return [
        {
          id: "discv1_" + createId(),
          code: "GLOBAL",
          active: true,
          name: "Global Test Discount",
          description: "This is a global test discount",
          canBeCombined: false,
          target: "product",
          type: "percentage",
          value: 10,
          minimumQuantity: 1,
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date(),
          updatedAt: null,
          deletedAt: null,
        },
      ];
    });

    return {
      create,
      findById,
      findByOrganizationId,
      findGlobalDiscounts,
      findByOrderIdAndProductId,
      findByOrderId,
      update,
      remove,
      safeRemove,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const DiscountLive = DiscountService.Default;

export type DiscountInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<DiscountService["findById"]>>>>;
