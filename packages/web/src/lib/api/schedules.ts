import { json, query } from "@solidjs/router";
import { ScheduleLive, ScheduleService } from "@warehouseoetzidev/core/src/entities/schedules";
import { Effect } from "effect";
import { run } from "./utils";

export const getSchedules = query(async (range?: [Date, Date]) => {
  "use server";
  return run(
    "@query/schedules-by-organization",
    Effect.gen(function* (_) {
      const scheduleService = yield* ScheduleService;
      const schedules = yield* scheduleService.findByOrganizationId(range);
      return schedules;
    }).pipe(Effect.provide(ScheduleLive)),
    json([]),
  );
}, "schedules-by-organization");
