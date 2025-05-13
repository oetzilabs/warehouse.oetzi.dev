import { action, json, query, redirect, revalidate } from "@solidjs/router";
import {
  AddressCreateSchema,
  WarehouseAreaCreateSchema,
  WarehouseAreaUpdateSchema,
  WarehouseCreateSchema,
  WarehouseCreateWithoutAddressAndTypeSchema,
  WarehouseUpdateSchema,
} from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { AddressLive, AddressService } from "@warehouseoetzidev/core/src/entities/addresses";
import { SessionLive, SessionService } from "@warehouseoetzidev/core/src/entities/sessions";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { WarehouseTypeLive, WarehouseTypeService } from "@warehouseoetzidev/core/src/entities/warehouse_types";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { InferInput } from "valibot";
import { getAuthenticatedUser } from "./auth";
import { withSession } from "./session";

export const getWarehouses = query(async () => {
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
      const service = yield* _(WarehouseService);
      return yield* service.findByUserId(user.id);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouses;
}, "user-warehouses");

export const getWarehouseById = query(async (id: string) => {
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
      const service = yield* _(WarehouseService);
      return yield* service.findById(id);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse;
}, "warehouse-by-id");

export const createWarehouse = action(
  async (
    data: InferInput<typeof WarehouseCreateWithoutAddressAndTypeSchema> & {
      address: InferInput<typeof AddressCreateSchema>;
    },
  ) => {
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
    const warehouse = await Effect.runPromise(
      Effect.gen(function* (_) {
        const warehouseService = yield* _(WarehouseService);
        const addressService = yield* _(AddressService);
        let address = yield* addressService.findByLatLon([data.address.lat, data.address.lon]);
        if (!address) {
          address = yield* addressService.create(data.address);
        }
        const createdWarehouse = yield* warehouseService.create(
          {
            ...data,
            address_id: address.id,
            // id from seed
            warehouse_type_id: "wht_ul6fl08era8zwp4eytmumg26",
          },
          orgId,
          session.userId,
        );

        // connect user to warehouse
        const sessionService = yield* _(SessionService);
        const sessionUpdated = yield* sessionService.update({
          id: session.id,
          current_warehouse_id: createdWarehouse.id,
        });

        const userService = yield* _(UserService);
        const userUpdated = yield* userService.update(session.userId, {
          id: session.userId,
          has_finished_onboarding: true,
        });

        return createdWarehouse;
      }).pipe(
        Effect.provide(WarehouseLive),
        Effect.provide(AddressLive),
        Effect.provide(SessionLive),
        Effect.provide(UserLive),
      ),
    );
    return redirect("/dashboard", {
      revalidate: [getAuthenticatedUser.key],
    });
  },
);

export const updateWarehouse = action(async (data: InferInput<typeof WarehouseUpdateSchema>) => {
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
      const service = yield* _(WarehouseService);
      return yield* service.update(data);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse;
});

export const deleteWarehouse = action(async (id: string) => {
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
      const service = yield* _(WarehouseService);
      return yield* service.remove(id);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse;
});

export const getWarehousesByOrganization = query(async (organizationId: string) => {
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
      const service = yield* _(WarehouseService);
      return yield* service.findByOrganizationId(organizationId);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouses;
}, "warehouses-by-organization");

export const getTypes = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const types = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseTypeService);
      return yield* service.all();
    }).pipe(Effect.provide(WarehouseTypeLive)),
  );
  return types;
}, "warehouse-types");

export const changeWarehouseDimensions = action(
  async (
    data: InferInput<typeof WarehouseUpdateSchema>["dimensions"] & {
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
        const service = yield* _(WarehouseService);
        const wh = yield* service.findById(data.id);
        if (!wh) {
          return yield* Effect.fail(new Error("Warehouse not found"));
        }
        const d = { dimensions: { width: data.width, height: data.height }, id: data.id };
        return yield* service.update(d);
      }).pipe(Effect.provide(WarehouseLive)),
    );
    return warehouse;
  },
);

export const changeWarehouse = action(async (whId) => {
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
      const sessionService = yield* _(SessionService);
      const warehouseService = yield* _(WarehouseService);
      const wh = yield* warehouseService.findById(whId);
      if (!wh) {
        return yield* Effect.fail(new Error("Warehouse not found"));
      }
      const switched = yield* sessionService.update({
        id: session.id,
        current_warehouse_id: wh.id,
      });
      if (!switched) {
        return yield* Effect.fail(new Error("Warehouse not updated"));
      }
      return wh;
    }).pipe(Effect.provide(SessionLive), Effect.provide(WarehouseLive)),
  );
  return json(warehouse, {
    revalidate: [getAuthenticatedUser.key],
  });
});

export const addWarehouseArea = action(async (data: InferInput<typeof WarehouseAreaCreateSchema>) => {
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
  const area = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      const wh = yield* service.findById(data.warehouse_facility_id);
      if (!wh) {
        return yield* Effect.fail(new Error("Warehouse not found"));
      }
      const area = yield* service.addArea(data, wh.id);
      return area;
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return json(area, {
    revalidate: [getAuthenticatedUser.key],
  });
});

export const updateWarehouseArea = action(async (data: InferInput<typeof WarehouseAreaUpdateSchema>) => {
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
  const area = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      const area = yield* service.findAreaById(data.id);
      if (!area) {
        return yield* Effect.fail(new Error("Area not found"));
      }
      const updatedArea = yield* service.updateArea(data, area.id);
      return updatedArea;
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return json(area, {
    revalidate: [getAuthenticatedUser.key],
  });
});
