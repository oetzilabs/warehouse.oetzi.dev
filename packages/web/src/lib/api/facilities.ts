import { action, json, query, redirect, revalidate } from "@solidjs/router";
import {
  AddressCreateSchema,
  FacilityCreateSchema,
  FacilityUpdateSchema,
} from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { AddressLive, AddressService } from "@warehouseoetzidev/core/src/entities/addresses";
import { FacilityLive, FacilityService } from "@warehouseoetzidev/core/src/entities/facilities";
import { FacilityNotFound } from "@warehouseoetzidev/core/src/entities/facilities/errors";
import { SessionLive, SessionService } from "@warehouseoetzidev/core/src/entities/sessions";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { WarehouseDoesNotContainFacility } from "@warehouseoetzidev/core/src/entities/warehouses/errors";
import { Effect } from "effect";
import { InferInput } from "valibot";
import { getAuthenticatedUser } from "./auth";
import { withSession } from "./session";

export const getFacilities = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const warehouses = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(FacilityService);
      return yield* service.findByUserId(user.id);
    }).pipe(Effect.provide(FacilityLive)),
  );
  return warehouses;
}, "user-warehouses");

export const getFacilityById = query(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(FacilityService);
      return yield* service.findById(id);
    }).pipe(Effect.provide(FacilityLive)),
  );
  return warehouse;
}, "warehouse-by-id");

export const getFacilityByWarehouseId = query(async (whid, fcid: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const whService = yield* _(WarehouseService);
      const fcService = yield* _(FacilityService);
      const wh = yield* whService.findById(whid);
      if (!wh) {
        return yield* Effect.fail(new Error("Warehouse not found"));
      }
      if (!wh.fcs.find((f) => f.id === fcid)) {
        return yield* Effect.fail(new WarehouseDoesNotContainFacility({ id: whid, fcid }));
      }
      return yield* fcService.findById(fcid);
    }).pipe(Effect.provide(FacilityLive), Effect.provide(WarehouseLive)),
  );
  return warehouse;
}, "warehouse-by-id");

export const createFacility = action(async (data: Omit<InferInput<typeof FacilityCreateSchema>, "ownerId">) => {
  "use server";
  const auth = await withSession();

  if (!auth) {
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
      const facilityService = yield* _(FacilityService);
      const createdFacility = yield* facilityService.create({
        ...data,
        ownerId: session.userId,
      });

      // connect user to warehouse
      const sessionService = yield* _(SessionService);
      const sessionUpdated = yield* sessionService.update({
        id: session.id,
        current_warehouse_facility_id: createdFacility.id,
      });

      return createdFacility;
    }).pipe(Effect.provide(FacilityLive), Effect.provide(SessionLive)),
  );
  return redirect("/dashboard", {
    revalidate: [getAuthenticatedUser.key],
  });
});

export const updateFacility = action(async (data: InferInput<typeof FacilityUpdateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(FacilityService);
      return yield* service.update(data);
    }).pipe(Effect.provide(FacilityLive)),
  );
  return warehouse;
});

export const deleteFacility = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(FacilityService);
      return yield* service.remove(id);
    }).pipe(Effect.provide(FacilityLive)),
  );
  return warehouse;
});

export const changeFacilityDimensions = action(
  async (
    data: InferInput<typeof FacilityUpdateSchema>["bounding_box"] & {
      id: string;
    },
  ) => {
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
    const warehouse = await Effect.runPromise(
      Effect.gen(function* (_) {
        const service = yield* _(FacilityService);
        const wh = yield* service.findById(data.id);
        if (!wh) {
          return yield* Effect.fail(new Error("Facility not found"));
        }
        const d = { dimensions: { width: data.width, height: data.height }, id: data.id };
        return yield* service.update(d);
      }).pipe(Effect.provide(FacilityLive)),
    );
    return warehouse;
  },
);

export const changeFacility = action(async (whId: string, fcId: string) => {
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
      const warehouseService = yield* _(WarehouseService);
      const wh = yield* warehouseService.findById(whId);
      if (!wh) {
        return yield* Effect.fail(new Error("Warehouse not found"));
      }
      const facilityService = yield* _(FacilityService);
      const fc = yield* facilityService.findById(fcId);
      if (!fc) {
        return yield* Effect.fail(new Error("Facility not found"));
      }
      if (!wh.fcs.find((f) => f.id === fc.id)) {
        return yield* Effect.fail(new Error("Facility not found"));
      }
      const switched = yield* sessionService.update({
        id: session.id,
        current_warehouse_facility_id: fc.id,
      });
      if (!switched) {
        return yield* Effect.fail(new Error("Facility not updated"));
      }
      return wh;
    }).pipe(Effect.provide(SessionLive), Effect.provide(FacilityLive), Effect.provide(WarehouseLive)),
  );
  return json(facility, {
    revalidate: [getAuthenticatedUser.key],
  });
});

export const getFacilityDevicesByWarehouseId = query(async (whid:string, fcid:string)=> {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const whService = yield* _(WarehouseService);
      const fcService = yield* _(FacilityService);
      const wh = yield* whService.findById(whid);
      if (!wh) {
        return yield* Effect.fail(new Error("Warehouse not found"));
      }
      if (!wh.fcs.find((f) => f.id === fcid)) {
        return yield* Effect.fail(new WarehouseDoesNotContainFacility({ id: whid, fcid }));
      }
      const fc = yield* fcService.findById(fcid);
      if (!fc) {
        return yield* Effect.fail(new FacilityNotFound({ id: fcid }));
      }
      return yield* fcService.findDevicesByFacilityId(fc.id);
    }).pipe(Effect.provide(FacilityLive), Effect.provide(WarehouseLive)),
  );
  return warehouse;

}, "device-by-facility-id");
