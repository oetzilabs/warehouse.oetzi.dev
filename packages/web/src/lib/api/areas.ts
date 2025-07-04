import { action, json, query } from "@solidjs/router";
import { AreaLive, AreaService } from "@warehouseoetzidev/core/src/entities/areas";
import { FacilityLive, FacilityService } from "@warehouseoetzidev/core/src/entities/facilities";
import { FacilityBadBoundingBox } from "@warehouseoetzidev/core/src/entities/facilities/errors";
import { InventoryLive } from "@warehouseoetzidev/core/src/entities/inventory";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect, Schema } from "effect";
import { getAuthenticatedUser } from "./auth";
import { runWithSession } from "./utils";

export const getAreas = query(async () => {
  "use server";
  return runWithSession(
    "@query/get-areas",
    Effect.fn(
      function* (session) {
        const service = yield* WarehouseService;
        const whs = yield* service.findByOrganizationId(session.current_organization_id);
        const areas = whs.flatMap((wh) =>
          wh.facilities.flatMap((fc) =>
            fc.areas.flatMap((a) => ({
              warehouse: wh.name,
              facility: fc.name,
              area: {
                id: a.id,
                name: a.name,
                barcode: a.barcode,
              },
            })),
          ),
        );
        return json(areas);
      },
      (effect) => effect.pipe(Effect.provide(WarehouseLive)),
    ),
    json(
      [] as {
        warehouse: string;
        facility: string;
        area: {
          id: string;
          name: string;
          barcode: string | null;
        };
      }[],
    ),
  );
}, "areas");

class MissingFacilityId extends Schema.TaggedError<MissingFacilityId>()("MissingFacilityId", {
  message: Schema.optional(Schema.String),
}) {}

export const createAreaMatchingFacility = action(async () => {
  "use server";
  return runWithSession(
    "@action/create-area-matching-facility",
    Effect.fn(
      function* (session) {
        const facilityService = yield* FacilityService;
        const service = yield* AreaService;
        const fcid = session.current_facility_id;
        if (!fcid) {
          return yield* Effect.fail(new MissingFacilityId({ message: "No facility id found in session" }));
        }
        const fc = yield* facilityService.findById(fcid);
        let bb = fc.bounding_box;
        if (!bb)
          return yield* Effect.fail(
            new FacilityBadBoundingBox({
              id: fcid,
            }),
          );
        yield* service.create({
          barcode: `NEW-AREA-${Math.floor(Math.random() * 10000)}`,
          warehouse_facility_id: fc.id,
          name: fc.name,
          description: fc.description,
          bounding_box: bb,
        });
        return json(true, {
          revalidate: [getAuthenticatedUser.key, getAreas.key],
        });
      },
      (effect) => effect.pipe(Effect.provide([FacilityLive, AreaLive, InventoryLive])),
    ),
    (errors) =>
      json(errors, {
        status: 500,
        statusText: "Internal Server Error",
        revalidate: [getAuthenticatedUser.key, getAreas.key],
      }),
  );
});
