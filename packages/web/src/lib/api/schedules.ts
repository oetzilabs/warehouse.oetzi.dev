import { json, query, redirect } from "@solidjs/router";
import { ScheduleLive, ScheduleService } from "@warehouseoetzidev/core/src/entities/schedules";
import { Effect } from "effect";
import { withSession } from "./session";

export const getSchedules = query(async () => {
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

  const schedules = await Effect.runPromise(
    Effect.gen(function* (_) {
      const scheduleService = yield* _(ScheduleService);
      const schedules = yield* scheduleService.findByOrganizationId(orgId);
      return schedules;
    }).pipe(Effect.provide(ScheduleLive)),
  );
  return schedules;
}, "schedules-by-organization");
