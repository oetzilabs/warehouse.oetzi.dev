import { json, query, redirect } from "@solidjs/router";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { SalesLive, SalesService } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { withSession } from "./session";

dayjs.extend(isoWeek);

export const getCashRegister = query(async (sid: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const session = auth[1];
  if (!session) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw new Error("You have to be part of an organization to perform this action.");
  }
  const organizationId = Layer.succeed(OrganizationId, orgId);
  const registerExit = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const salesService = yield* _(SalesService);
      if (!sid) {
        return yield* Effect.succeed(null);
      }
      const register = yield* salesService.findById(sid);

      return register;
    }).pipe(Effect.provide(SalesLive), Effect.provide(organizationId)),
  );
  return Exit.match(registerExit, {
    onSuccess: (register) => json(register),
    onFailure: (cause) => {
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred at 'getCashRegister': ${errors.join(", ")}`);
    },
  });
}, "cash-register");

export const getCashRegisterSessions = query(async (sid: string | undefined, weeks: number) => {
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
  const registerExit = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const salesService = yield* _(SalesService);
      let ws = weeks;
      if (sid) {
        const sale = yield* salesService
          .findById(sid)
          .pipe(Effect.catchTag("SaleNotFound", () => Effect.succeed(null)));
        if (sale) {
          // get the weeks from the sale
          ws = dayjs().isoWeek() - dayjs(sale.createdAt).isoWeek();
        }
      }

      const sales = yield* salesService.findByOrganizationId(orgId);

      return sales.filter((s) => {
        const start = dayjs(s.createdAt).isAfter(dayjs().subtract(ws, "week").startOf("week"));
        const end = dayjs(s.createdAt).isBefore(dayjs().subtract(ws, "week").endOf("week"));
        return start && end;
      });
    }).pipe(Effect.provide(SalesLive), Effect.provide(organizationId)),
  );
  return Exit.match(registerExit, {
    onSuccess: (register) => json(register),
    onFailure: (cause) => {
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
}, "cash-register-sessions");
