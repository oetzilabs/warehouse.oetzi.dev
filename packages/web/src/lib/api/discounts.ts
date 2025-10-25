import { action, json, query } from "@solidjs/router";
import { DiscountLive, DiscountService } from "@warehouseoetzidev/core/src/entities/discounts";
import { Effect } from "effect";
import { run, runWithSession } from "./utils";

export const getDiscounts = query(() => {
  "use server";
  return runWithSession(
    "@query/get-discounts",
    Effect.fn(
      function* (session) {
        const discountService = yield* DiscountService;
        const discounts = yield* discountService.findByOrganizationId(session.current_organization_id);
        const globalDiscounts = yield* discountService.findGlobalDiscounts();
        const combined = [...discounts, ...globalDiscounts];
        return json(combined);
      },
      (effect) => effect.pipe(Effect.provide(DiscountLive)),
    ),
    json([]),
  );
}, "discounts");

export const getDiscountsApplied = query((orderId: string) => {
  "use server";
  return run(
    "@query/get-discounts-applied",
    Effect.gen(function* () {
      const discountService = yield* DiscountService;
      const discounts = yield* discountService.findByOrderId(orderId);
      return json(discounts);
    }).pipe(Effect.provide(DiscountLive)),
    json([]),
  );
}, "discounts-applied");

export const getDiscountsAppliedOnProduct = query((orderId: string, productId: string) => {
  "use server";
  return run(
    "@query/get-discounts-applied-on-product",
    Effect.gen(function* () {
      const discountService = yield* DiscountService;
      const discounts = yield* discountService.findByOrderIdAndProductId(orderId, productId);
      return json(discounts);
    }).pipe(Effect.provide(DiscountLive)),
    json([]),
  );
}, "discounts-applied-on-product");
