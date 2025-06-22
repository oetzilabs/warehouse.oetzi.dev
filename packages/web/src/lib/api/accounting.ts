import { getAuthenticatedUser } from "@/lib/api/auth";
import { action, json, query, redirect } from "@solidjs/router";
import { AccountingLive, AccountingService } from "@warehouseoetzidev/core/src/entities/accounting";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
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
      const service = yield* _(AccountingService);
      return yield* service.getFinancialSummary();
    }).pipe(Effect.provide(AccountingLive), Effect.provide(organizationId)),
  );
  return list;
}, "organization-accounting");
