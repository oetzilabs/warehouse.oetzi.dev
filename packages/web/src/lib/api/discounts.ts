import { action, json, query, redirect } from "@solidjs/router";
import { DiscountLive, DiscountService } from "@warehouseoetzidev/core/src/entities/discounts";
import { Cause, Chunk, Effect, Exit } from "effect";
import { withSession } from "./session";

export const getDiscounts = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const discounts = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const discountService = yield* _(DiscountService);
      const discounts = yield* discountService.findByOrganizationId(orgId);
      return discounts;
    }).pipe(Effect.provide(DiscountLive)),
  );

  return Exit.match(discounts, {
    onSuccess: (discounts) => {
      return json(discounts);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => c.message);
      throw redirect(`/error?message=${encodeURI(errors.join(", "))}&function=unknown`, {
        status: 500,
        statusText: `Internal Server Error: ${errors.join(", ")}`,
      });
    },
  });
}, "discounts");
