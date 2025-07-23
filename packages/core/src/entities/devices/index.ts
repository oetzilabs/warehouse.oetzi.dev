import { eq } from "drizzle-orm";
import { Effect, Option, Schema } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import {
  device_status_enum_values,
  DeviceCreateSchema,
  DeviceUpdateSchema,
  TB_devices,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId, OrganizationNotFound } from "../organizations/errors";
import { OrganizationId } from "../organizations/id";
import { WarehouseInvalidId } from "../warehouses/errors";
import { DeviceInvalidId, DeviceNotCreated, DeviceNotDeleted, DeviceNotFound, DeviceNotUpdated } from "./errors";

export const DeviceFindBySchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Literal(...device_status_enum_values)),
  latestCreated: Schema.optional(Schema.Boolean),
  latestUpdated: Schema.optional(Schema.Boolean),
});

export class DeviceService extends Effect.Service<DeviceService>()("@warehouse/devices", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;

    const create = Effect.fn("@warehouse/devices/create")(function* (
      input: Omit<InferInput<typeof DeviceCreateSchema>, "organization_id">,
    ) {
      const orgId = yield* OrganizationId;
      const [device] = yield* db
        .insert(TB_devices)
        .values({ ...input, organization_id: orgId })
        .returning();

      if (!device) {
        return yield* Effect.fail(new DeviceNotCreated({}));
      }

      return device;
    });

    const findById = Effect.fn("@warehouse/devices/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new DeviceInvalidId({ id }));
      }

      const device = yield* db.query.TB_devices.findFirst({
        where: (devices, operations) => operations.eq(devices.id, parsedId.output),
        with: {
          type: true,
        },
      });

      if (!device) {
        return yield* Effect.fail(new DeviceNotFound({ id }));
      }

      return device;
    });

    const update = Effect.fn("@warehouse/devices/update")(function* (input: InferInput<typeof DeviceUpdateSchema>) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new DeviceInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_devices)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_devices.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new DeviceNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/devices/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new DeviceInvalidId({ id }));
      }

      const [deleted] = yield* db.delete(TB_devices).where(eq(TB_devices.id, parsedId.output)).returning();

      if (!deleted) {
        return yield* Effect.fail(new DeviceNotDeleted({ id }));
      }

      return deleted;
    });

    const all = Effect.fn("@warehouse/devices/all")(function* () {
      return yield* db.query.TB_devices.findMany({
        // where: (fields, operations) => operations.isNull(fields.deletedAt),
        with: {
          type: true,
        },
      });
    });

    const findBy = Effect.fn("@warehouse/devices/findByName")(function* (filter: typeof DeviceFindBySchema.Type) {
      return yield* db.query.TB_devices.findMany({
        where: (fields, operations) =>
          operations.or(
            ...(filter.name ? [operations.ilike(fields.name, `%${filter.name}%`)] : []),
            ...(filter.status ? [operations.eq(fields.status, filter.status)] : []),
          ),
        with: {
          type: true,
        },
      });
    });

    type DeviceInclude = "deleted";

    const allWithInclude = Effect.fn("@warehouse/devices/allWithInclude")(function* (
      filter: Option.Option<DeviceInclude>,
    ) {
      const _filter = Option.getOrNull(filter);
      return yield* db.query.TB_devices.findMany({
        where: (fields, operations) => {
          switch (_filter) {
            case "deleted":
              return undefined;
            default:
              return operations.isNull(fields.deletedAt);
          }
        },
        with: {
          type: true,
        },
      });
    });

    const findByOrganizationId = Effect.fn("@warehouse/devices/findByOrganizationId")(function* () {
      const orgId = yield* OrganizationId;
      // look into all the facilites of the warehouse
      const orgs = yield* db.query.TB_organizations.findFirst({
        where: (fields, operations) => operations.eq(fields.id, orgId),
        with: {
          devices: {
            with: {
              type: true,
            },
            where: (fields, operators) => operators.isNull(fields.deletedAt),
          },
        },
      });
      if (!orgs) {
        return yield* Effect.fail(new OrganizationNotFound({ id: orgId }));
      }
      return orgs.devices;
    });

    const getDeviceTypes = Effect.fn("@warehouse/devices/getDeviceTypes")(function* () {
      const deviceTypes = yield* db.query.TB_device_types.findMany();
      return deviceTypes;
    });

    const safeRemove = Effect.fn("@warehouse/devices/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new DeviceInvalidId({ id }));
      }

      const [deleted] = yield* db
        .update(TB_devices)
        .set({ deletedAt: new Date() })
        .where(eq(TB_devices.id, parsedId.output))
        .returning();

      if (!deleted) {
        return yield* Effect.fail(new DeviceNotDeleted({ id }));
      }

      return deleted;
    });

    const lastCreated = Effect.fn("@warehouse/devices/lastCreated")(function* () {
      const lastCreatedDevice = yield* db.query.TB_devices.findFirst({
        where: (fields, operations) => operations.isNull(fields.deletedAt),
        orderBy: (fields, operations) => operations.desc(fields.createdAt),
      });
      return lastCreatedDevice;
    });

    const lastUpdated = Effect.fn("@warehouse/devices/lastUpdated")(function* () {
      const lastUpdatedDevice = yield* db.query.TB_devices.findFirst({
        where: (fields, operations) =>
          operations.and(operations.isNull(fields.deletedAt), operations.isNotNull(fields.updatedAt)),
        orderBy: (fields, operations) => operations.desc(fields.updatedAt),
      });
      return lastUpdatedDevice;
    });

    return {
      create,
      findById,
      findBy,
      update,
      remove,
      safeRemove,
      all,
      allWithInclude,
      findByOrganizationId,
      getDeviceTypes,
      lastCreated,
      lastUpdated,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const DeviceLive = DeviceService.Default;

// Type exports
export type DeviceInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<DeviceService["findById"]>>>>;
export type DeviceUpdateInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<DeviceService["update"]>>>>;
