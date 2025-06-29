import { action, json, query, redirect } from "@solidjs/router";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { SalesLive, SalesService } from "@warehouseoetzidev/core/src/entities/sales";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { withSession } from "./session";

export const getSalesLastFewMonths = query(async () => {
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
    if (!user.has_finished_onboarding) {
      return redirect("/onboarding");
    }
    throw new Error("You have to be part of an organization to perform this action.");
  }
  const organizationId = Layer.succeed(OrganizationId, orgId);
  // create a date range of the last few months
  const months = new Array(6)
    .fill(0)
    .map((_, i) => i + 1)
    .map((i) => dayjs().subtract(i, "month"));
  const range = months.map((m) => m.toDate());

  const sales = await Effect.runPromise(
    Effect.gen(function* (_) {
      const salesService = yield* _(SalesService);
      const sales = yield* salesService.findWithinRange(range[0], range[5]);
      if (!sales) {
        return yield* Effect.fail(new Error("Sale not found"));
      }
      return sales;
    }).pipe(Effect.provide(SalesLive), Effect.provide(organizationId)),
  );

  const obj = {
    labels: months.map((m) => m.format("MMM")),
    datasets: [
      {
        label: "Sales",
        data: [0],
        fill: false,
        pointStyle: false,
      },
    ],
  };
  return obj;
}, "sales-last-few-months");

export const getSales = query(async () => {
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
    if (!user.has_finished_onboarding) {
      return redirect("/onboarding");
    }
    throw new Error("You have to be part of an organization to perform this action");
  }
  const sales = await Effect.runPromise(
    Effect.gen(function* (_) {
      const salesService = yield* _(SalesService);
      const sales = yield* salesService.findByOrganizationId(orgId);
      if (!sales) {
        return yield* Effect.fail(new Error("Sale not found"));
      }
      return sales;
    }).pipe(Effect.provide(SalesLive)),
  );
  return sales;
}, "sales-by-organization-id");

export const getSaleById = query(async (sid: string) => {
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
  const organizationId = Layer.succeed(OrganizationId, orgId);
  const sale = await Effect.runPromise(
    Effect.gen(function* (_) {
      const salesService = yield* _(SalesService);
      const sale = yield* salesService.findById(sid);
      if (!sale) {
        return yield* Effect.fail(new Error("Sale not found"));
      }
      return sale;
    }).pipe(Effect.provide(SalesLive), Effect.provide(organizationId)),
  );
  return sale;
}, "sale-by-id");

export const deleteSale = action(async (sid: string) => {
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
      const salesService = yield* _(SalesService);
      yield* salesService.safeRemove(sid);
      return true;
    }).pipe(Effect.provide(SalesLive)),
  );

  return Exit.match(result, {
    onSuccess: () => {
      return json(
        { success: true },
        {
          revalidate: [getSales.key, getSaleById.keyFor(sid)],
        },
      );
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
});
