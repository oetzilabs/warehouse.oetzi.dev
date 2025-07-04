import { SqlError } from "@effect/sql/SqlError";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { ConfigError } from "effect/ConfigError";
import { safeParse, type InferInput } from "valibot";
import {
  TB_organizations_warehouses,
  TB_storages,
  TB_users_warehouses,
  TB_warehouse_products,
  TB_warehouses,
  WarehouseCreateSchema,
  WarehouseUpdateSchema,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { MissingConfig } from "../config";
import { FacilityLive, FacilityService } from "../facilities";
import { FacilityNotFound } from "../facilities/errors";
import { OrganizationId } from "../organizations/id";
import { ProductInvalidId, ProductNotDeleted, ProductNotFound } from "../products/errors";
import { StorageInfo, StorageLive, StorageService } from "../storages";
import { StorageInvalidId, StorageNotFound } from "../storages/errors";
import {
  WarehouseInvalidId,
  WarehouseNotCreated,
  WarehouseNotDeleted,
  WarehouseNotFound,
  WarehouseNotFoundForOrganization,
  WarehouseNotUpdated,
  WarehouseOrganizationInvalidId,
  WarehouseOrganizationLinkFailed,
  WarehouseUserInvalidId,
  WarehouseUserLinkFailed,
} from "./errors";

export class WarehouseService extends Effect.Service<WarehouseService>()("@warehouse/warehouses", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;

    const create = Effect.fn("@warehouse/warehouses/create")(function* (
      userInput: InferInput<typeof WarehouseCreateSchema>,
      userId: string,
    ) {
      const orgId = yield* OrganizationId;
      const parsedUserId = safeParse(prefixed_cuid2, userId);
      if (!parsedUserId.success) {
        return yield* Effect.fail(new WarehouseUserInvalidId({ userId }));
      }

      const [warehouse] = yield* db
        .insert(TB_warehouses)
        .values({ ...userInput, ownerId: parsedUserId.output })
        .returning();
      if (!warehouse) {
        return yield* Effect.fail(new WarehouseNotCreated({}));
      }

      const connectedToOrg = yield* db
        .insert(TB_organizations_warehouses)
        .values({
          organizationId: orgId,
          warehouseId: warehouse.id,
        })
        .returning();

      if (!connectedToOrg) {
        return yield* Effect.fail(
          new WarehouseOrganizationLinkFailed({ organizationId: orgId, warehouseId: warehouse.id }),
        );
      }

      const connectedToUser = yield* db
        .insert(TB_users_warehouses)
        .values({
          userId: parsedUserId.output,
          warehouseId: warehouse.id,
        })
        .returning();

      if (!connectedToUser) {
        return yield* Effect.fail(
          new WarehouseUserLinkFailed({ userId: parsedUserId.output, warehouseId: warehouse.id }),
        );
      }

      return warehouse;
    });

    const findById = Effect.fn("@warehouse/warehouses/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new WarehouseInvalidId({ id }));
      }

      const warehouse = yield* db.query.TB_warehouses.findFirst({
        where: (warehouses, operations) => operations.eq(warehouses.id, parsedId.output),
        with: {
          addresses: {
            with: {
              address: true,
            },
          },
          facilities: {
            with: {
              areas: {
                with: {
                  storages: {
                    with: {
                      type: true,
                      area: true,
                      products: true,
                      children: true,
                    },
                  },
                },
              },
            },
          },
          owner: {
            columns: {
              hashed_password: false,
            },
          },
          products: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!warehouse) {
        return yield* Effect.fail(new WarehouseNotFound({ id }));
      }

      return warehouse;
    });

    const update = Effect.fn("@warehouse/warehouses/update")(function* (
      input: InferInput<typeof WarehouseUpdateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new WarehouseInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_warehouses)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_warehouses.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new WarehouseNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/warehouses/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new WarehouseInvalidId({ id }));
      }

      const entries = yield* db.query.TB_organizations_warehouses.findMany({
        where: (fields, operations) => operations.eq(fields.warehouseId, parsedId.output),
        with: {
          organization: true,
        },
      });

      if (entries.length > 0) {
        // remove the warehouse from the associated organizations
        yield* db
          .delete(TB_organizations_warehouses)
          .where(eq(TB_organizations_warehouses.warehouseId, parsedId.output))
          .returning();
      }

      // remove the warehouse itself
      const [deleted] = yield* db.delete(TB_warehouses).where(eq(TB_warehouses.id, parsedId.output)).returning();

      if (!deleted) {
        return yield* Effect.fail(new WarehouseNotDeleted({ id }));
      }

      return deleted;
    });

    const findByOrganizationId = Effect.fn("@warehouse/warehouses/findByOrganizationId")(
      function* (organizationId: string) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new WarehouseOrganizationInvalidId({ organizationId }));
        }

        const entries = yield* db.query.TB_organizations_warehouses.findMany({
          where: (fields, operations) => operations.eq(fields.organizationId, parsedOrgId.output),
          with: {
            warehouse: {
              with: {
                addresses: {
                  with: {
                    address: true,
                  },
                },
                owner: {
                  columns: {
                    hashed_password: false,
                  },
                },
                products: {
                  with: {
                    product: true,
                  },
                },
              },
            },
          },
        });

        if (entries.length === 0) {
          return yield* Effect.fail(new WarehouseNotFoundForOrganization({ organizationId }));
        }
        const whs = entries.map((entry) => entry.warehouse);
        const facilityService = yield* _(FacilityService);
        const newWhsList = [];
        for (const entry of whs) {
          const facilities = yield* facilityService.findByWarehouseId(entry.id);
          const wh = {
            ...entry,
            facilities,
          };
          newWhsList.push(wh);
        }

        return newWhsList;
      },
      (effect) => effect.pipe(Effect.provide(FacilityLive)),
    );

    const safeRemove = Effect.fn("@warehouse/warehouses/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new WarehouseInvalidId({ id }));
      }

      const entries = yield* db
        .update(TB_warehouses)
        .set({ deletedAt: new Date() })
        .where(eq(TB_warehouses.id, parsedId.output))
        .returning();

      if (entries.length === 0) {
        return yield* Effect.fail(new WarehouseNotCreated({ message: "Failed to safe remove warehouse" }));
      }

      return entries[0];
    });

    const all = Effect.fn("@warehouse/warehouses/all")(function* () {
      return yield* db.query.TB_warehouses.findMany();
    });

    const findByUserId = Effect.fn("@warehouse/warehouses/findByUserId")(function* (userId: string) {
      const parsedUserId = safeParse(prefixed_cuid2, userId);
      if (!parsedUserId.success) {
        return yield* Effect.fail(new WarehouseUserInvalidId({ userId }));
      }

      const entries = yield* db.query.TB_users_warehouses.findMany({
        where: (fields, operations) => operations.eq(fields.userId, parsedUserId.output),
        with: {
          warehouse: {
            with: {
              facilities: true,
            },
          },
        },
      });

      return entries.map((entry) => entry.warehouse);
    });

    const findAreaById = Effect.fn("@warehouse/warehouses/findAreaById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new WarehouseInvalidId({ id }));
      }
      const area = yield* db.query.TB_warehouse_areas.findFirst({
        where: (fields, operations) => operations.eq(fields.id, parsedId.output),
      });
      if (!area) {
        return yield* Effect.fail(new WarehouseNotFound({ id }));
      }
      return area;
    });

    const findLastCreatedFacility = Effect.fn("@warehouse/warehouses/findLastCreatedFacility")(function* (
      warehouseId: string,
    ) {
      const parsedId = safeParse(prefixed_cuid2, warehouseId);
      if (!parsedId.success) {
        return yield* Effect.fail(new WarehouseInvalidId({ id: warehouseId }));
      }

      const f = yield* db.query.TB_warehouse_facilities.findFirst({
        where: (fields, operations) => operations.eq(fields.ownerId, parsedId.output),
        orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
        with: {
          areas: {
            with: {
              storages: {
                with: {
                  type: true,
                  area: true,
                  products: true,
                  children: true,
                },
              },
            },
          },
        },
      });
      if (!f) {
        return yield* Effect.fail(new FacilityNotFound({ id: parsedId.output }));
      }

      return f;
    });

    const findProductById = Effect.fn("@warehouse/warehouses/findProductById")(function* (whId: string, pid: string) {
      const parsedWhId = safeParse(prefixed_cuid2, whId);
      if (!parsedWhId.success) {
        return yield* Effect.fail(new WarehouseInvalidId({ id: whId }));
      }
      const parsedPid = safeParse(prefixed_cuid2, pid);
      if (!parsedPid.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: pid }));
      }

      const whProduct = yield* db.query.TB_warehouse_products.findFirst({
        where: (fields, operations) =>
          operations.and(eq(fields.warehouseId, parsedWhId.output), eq(fields.productId, parsedPid.output)),
        with: {
          product: {
            with: {
              labels: true,
              suppliers: {
                with: {
                  supplier: true,
                },
              },
              brands: true,
              certs: {
                with: {
                  cert: true,
                },
              },
              stco: {
                with: {
                  condition: true,
                },
              },
            },
          },
        },
      });

      if (!whProduct) {
        return yield* Effect.fail(new ProductNotFound({ id: pid }));
      }

      return whProduct.product;
    });

    const removeProduct = Effect.fn("@warehouse/warehouses/removeProduct")(function* (whId: string, pid: string) {
      const parsedWhId = safeParse(prefixed_cuid2, whId);
      if (!parsedWhId.success) {
        return yield* Effect.fail(new WarehouseInvalidId({ id: whId }));
      }
      const parsedPid = safeParse(prefixed_cuid2, pid);
      if (!parsedPid.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: pid }));
      }

      const whProduct = yield* db
        .delete(TB_warehouse_products)
        .where(
          and(
            eq(TB_warehouse_products.warehouseId, parsedWhId.output),
            eq(TB_warehouse_products.productId, parsedPid.output),
          ),
        )
        .returning();

      if (!whProduct) {
        return yield* Effect.fail(new ProductNotDeleted({ id: pid }));
      }

      return whProduct;
    });

    const deepStorageChildren = (
      storage: StorageInfo,
    ): Effect.Effect<StorageInfo, StorageNotFound | StorageInvalidId | MissingConfig | SqlError | ConfigError> =>
      Effect.gen(function* (_) {
        const storageService = yield* StorageService;
        const s = yield* storageService.findById(storage.id);
        if (!s) {
          return storage;
        }

        if (!s.children || s.children.length === 0) {
          return s;
        }

        const c_children = yield* Effect.all(
          s.children.map((child) => Effect.suspend(() => deepStorageChildren(child as StorageInfo))),
        );

        return {
          ...s,
          children: c_children,
        } satisfies StorageInfo;
      }).pipe(Effect.provide(StorageLive));

    const countStorageStats = Effect.fn("@warehouse/warehouses/countStorageStats")(function* (storage: StorageInfo) {
      const fullStorage = yield* deepStorageChildren(storage);

      const calculateStats = (
        s: StorageInfo,
      ): { storageCount: number; currentOccupancy: number; totalCapacity: number } => {
        let stats = {
          storageCount: 1,
          currentOccupancy: s.products?.length ?? 0,
          totalCapacity: s.capacity ?? 0,
        };

        if (s.children && s.children.length > 0) {
          const childStats = s.children.map((c) => calculateStats(c as StorageInfo));
          childStats.forEach((cs) => {
            stats.storageCount += cs.storageCount;
            stats.currentOccupancy += cs.currentOccupancy;
            stats.totalCapacity += cs.totalCapacity;
          });
        }

        return stats;
      };

      return calculateStats(fullStorage);
    });

    const getInventoryInfo = Effect.fn("@warehouse/warehouses/getInventoryInfo")(function* (whId: string) {
      const wh = yield* findById(whId);
      if (!wh) {
        return yield* Effect.fail(new WarehouseNotFound({ id: whId }));
      }
      const facilites = wh.facilities;
      const areas = facilites.flatMap((fc) => fc.areas);
      const storages = areas.flatMap((a) => a.storages);

      const strs = yield* db.query.TB_storages.findMany({
        where: (fields, operations) =>
          operations.inArray(
            fields.id,
            storages.map((f) => f.id),
          ),
        with: {
          type: true,
          area: true,
          products: {
            with: {
              product: {
                with: {
                  images: {
                    with: {
                      image: true,
                    },
                  },
                  brands: true,
                  saleItems: {
                    with: {
                      sale: {
                        with: {
                          customer: true,
                        },
                      },
                    },
                  },
                  orders: {
                    with: {
                      customerOrder: true,
                    },
                  },
                  labels: {
                    with: {
                      label: true,
                    },
                  },
                  stco: {
                    with: {
                      condition: true,
                    },
                  },
                  suppliers: {
                    with: {
                      supplier: {
                        with: {
                          contacts: true,
                          notes: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          children: true,
          labels: true,
          parent: true,
        },
      });

      const stats = yield* Effect.all(strs.map((storage) => countStorageStats(storage)));
      const totals = stats.reduce(
        (acc, stat) => ({
          storageCount: acc.storageCount + stat.storageCount,
          currentOccupancy: acc.currentOccupancy + stat.currentOccupancy,
          totalCapacity: acc.totalCapacity + stat.totalCapacity,
        }),
        { storageCount: 0, currentOccupancy: 0, totalCapacity: 0 },
      );

      return yield* Effect.succeed({
        amountOfStorages: totals.storageCount,
        totalCurrentOccupancy: totals.currentOccupancy,
        totalCapacity: totals.totalCapacity,
      });
    });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByOrganizationId,
      all,
      findByUserId,
      findAreaById,
      findLastCreatedFacility,
      findProductById,
      removeProduct,
      getInventoryInfo,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const WarehouseLive = WarehouseService.Default;

// Type exports
export type WarehouseInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<WarehouseService["findById"]>>>>;
export type WarehouseInventoryInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<WarehouseService["getInventoryInfo"]>>>
>;
