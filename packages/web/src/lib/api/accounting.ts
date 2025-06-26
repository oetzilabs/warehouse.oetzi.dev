import { getAuthenticatedUser } from "@/lib/api/auth";
import { action, json, query, redirect } from "@solidjs/router";
import { AccountingLive, AccountingService } from "@warehouseoetzidev/core/src/entities/accounting";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { SalesLive, SalesService } from "@warehouseoetzidev/core/src/entities/sales";
import { SupplierLive, SupplierService } from "@warehouseoetzidev/core/src/entities/suppliers";
import { Cause, Chunk, Console, Effect, Exit, Layer } from "effect";
import { InferInput } from "valibot";
import { withSession } from "./session";

export const getAccountingList = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const organizationId = Layer.succeed(OrganizationId, orgId);

  const list = await Effect.runPromise(
    Effect.gen(function* (_) {
      const accounting = yield* _(AccountingService);
      const salesService = yield* _(SalesService);
      const supplierService = yield* _(SupplierService);

      // Fetch sales and supplier purchases for the organization
      const sales = yield* salesService.listIncomes();
      const income = {
        sales,
      };
      const boughtBySuppliers = yield* supplierService.getPurchases();
      const expenses = {
        bought: boughtBySuppliers,
      };
      const s = yield* accounting.summarize({ income, expenses });
      // yield* Console.log(s);
      return s;
    }).pipe(
      Effect.provide(AccountingLive),
      Effect.provide(SalesLive),
      Effect.provide(SupplierLive),
      Effect.provide(organizationId),
      // Provide other services as needed
    ),
  );
  return list;
}, "organization-accounting");
