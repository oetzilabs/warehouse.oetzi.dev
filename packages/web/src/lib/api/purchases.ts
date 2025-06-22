import { action, json, query, redirect } from "@solidjs/router";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { PurchasesLive, PurchasesService } from "@warehouseoetzidev/core/src/entities/purchases";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { withSession } from "./session";

export const getPurchases = query(async () => {
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
  const orders = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const ordersService = yield* _(PurchasesService);
      const orders = yield* ordersService.findByOrganizationId(orgId);
      return orders;
    }).pipe(Effect.provide(PurchasesLive)),
  );
  return Exit.match(orders, {
    onSuccess: (ords) => {
      return json(ords);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred at 'getPurchases': ${errors.join(", ")}`);
    },
  });
}, "purchased-orders");

export const getPendingPurchases = query(async () => {
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
  const orders = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const ordersService = yield* _(PurchasesService);
      const orders = yield* ordersService.findByOrganizationId(orgId);
      return orders.filter((o) => o.status === "pending" || o.status === "processing");
    }).pipe(Effect.provide(PurchasesLive)),
  );
  return Exit.match(orders, {
    onSuccess: (ords) => {
      return json(ords);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred at 'getPendingPurchases': ${errors.join(", ")}`);
    },
  });
}, "sales-order-by-warehouse-id");

export const getPurchaseById = query(async (pid: string) => {
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

  const organizationIdLayer = Layer.succeed(OrganizationId, orgId);

  const purchase = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const purchaseService = yield* _(PurchasesService);
      const purchase = yield* purchaseService.findById(pid);
      return purchase;
    }).pipe(Effect.provide(PurchasesLive), Effect.provide(organizationIdLayer)),
  );

  return Exit.match(purchase, {
    onSuccess: (purchase) => {
      return json(purchase);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => c.message);
      throw new Error(`Some error(s) occurred at 'getPurchaseById': ${errors.join(", ")}`);
    },
  });
}, "purchase-by-id");

export const deletePurchase = action(async (pid: string) => {
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

  const result = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const purchaseService = yield* _(PurchasesService);
      yield* purchaseService.safeRemove(pid);
      return true;
    }).pipe(Effect.provide(PurchasesLive)),
  );

  return Exit.match(result, {
    onSuccess: () => {
      return json(
        { success: true },
        {
          revalidate: [getPendingPurchases.key, getPurchaseById.keyFor(pid), getPurchases.key],
        },
      );
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => c.message);
      throw new Error(`Some error(s) occurred at 'deletePurchase': ${errors.join(", ")}`);
    },
  });
});
