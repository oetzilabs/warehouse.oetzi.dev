import { action, json, redirect } from "@solidjs/router";
import { AreaLive, AreaService } from "@warehouseoetzidev/core/src/entities/areas";
import { FacilityLive, FacilityService } from "@warehouseoetzidev/core/src/entities/facilities";
import { SessionLive, SessionService } from "@warehouseoetzidev/core/src/entities/sessions";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { getAuthenticatedUser } from "./auth";
import { withSession } from "./session";

type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const updateAreaBoundingBox = action(async (fcId: string, areaId: string, bb: BoundingBox) => {
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
  const facility = await Effect.runPromise(
    Effect.gen(function* (_) {
      const sessionService = yield* _(SessionService);
      const fcService = yield* _(FacilityService);
      const areaService = yield* _(AreaService);
      const fc = yield* fcService.findById(fcId);
      if (!fc) {
        return yield* Effect.fail(new Error("Facility not found"));
      }
      const area = yield* areaService.findById(areaId);
      if (!area) {
        return yield* Effect.fail(new Error("Area not found"));
      }
      const updatedArea = yield* areaService.update({
        id: area.id,
        bounding_box: bb,
      });

      return updatedArea;
    }).pipe(
      Effect.provide(SessionLive),
      Effect.provide(FacilityLive),
      Effect.provide(WarehouseLive),
      Effect.provide(AreaLive),
    ),
  );
  return json(facility, {
    revalidate: [getAuthenticatedUser.key],
  });
});
