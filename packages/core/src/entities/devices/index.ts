import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import devices from "../../data/devices.json";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { DeviceCreateSchema, DeviceUpdateSchema, TB_devices } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId, OrganizationNotFound } from "../organizations/errors";
import { WarehouseInvalidId } from "../warehouses/errors";
import { DeviceInvalidId, DeviceNotCreated, DeviceNotDeleted, DeviceNotFound, DeviceNotUpdated } from "./errors";

export class DeviceService extends Effect.Service<DeviceService>()("@warehouse/devices", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_devices.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        type: true,
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (input: InferInput<typeof DeviceCreateSchema>) =>
      Effect.gen(function* (_) {
        const [device] = yield* Effect.promise(() => db.insert(TB_devices).values(input).returning());

        if (!device) {
          return yield* Effect.fail(new DeviceNotCreated({}));
        }

        return device;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DeviceInvalidId({ id }));
        }

        const device = yield* Effect.promise(() =>
          db.query.TB_devices.findFirst({
            where: (devices, operations) => operations.eq(devices.id, parsedId.output),
            with: {
              type: true,
            },
          }),
        );

        if (!device) {
          return yield* Effect.fail(new DeviceNotFound({ id }));
        }

        return device;
      });

    const update = (input: InferInput<typeof DeviceUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DeviceInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_devices)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_devices.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new DeviceNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DeviceInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_devices).where(eq(TB_devices.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new DeviceNotDeleted({ id }));
        }

        return deleted;
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_devices.findMany());
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const dbDevices = yield* Effect.promise(() => db.query.TB_devices.findMany());

        const devs = parse(
          array(
            object({
              ...DeviceCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          devices,
        );

        const existing = dbDevices.map((d) => d.id);
        const toCreate = devs.filter((d) => !existing.includes(d.id));

        if (toCreate.length > 0) {
          yield* Effect.promise(() => db.insert(TB_devices).values(toCreate).returning());
          yield* Effect.log("Created devices", toCreate);
        }

        const toUpdate = devs.filter((d) => existing.includes(d.id));
        if (toUpdate.length > 0) {
          for (const device of toUpdate) {
            yield* Effect.promise(() =>
              db
                .update(TB_devices)
                .set({ ...device, updatedAt: new Date() })
                .where(eq(TB_devices.id, device.id))
                .returning(),
            );
          }
        }

        return devs;
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        // look into all the facilites of the warehouse
        const orgs = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedOrganizationId.output),
            with: {
              devices: {
                with: {
                  type: true,
                },
                where: (fields, operators) => operators.isNull(fields.deletedAt),
              },
            },
          }),
        );
        if (!orgs) {
          return yield* Effect.fail(new OrganizationNotFound({ id: organizationId }));
        }
        return orgs.devices;
      });

    const getDeviceTypes = () =>
      Effect.gen(function* (_) {
        const deviceTypes = yield* Effect.promise(() => db.query.TB_device_types.findMany());
        return deviceTypes;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DeviceInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.update(TB_devices).set({ deletedAt: new Date() }).where(eq(TB_devices.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new DeviceNotDeleted({ id }));
        }

        return deleted;
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      all,
      seed,
      findByOrganizationId,
      getDeviceTypes,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const DeviceLive = DeviceService.Default;

// Type exports
export type DeviceInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<DeviceService["findById"]>>>>;
export type DeviceUpdateInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<DeviceService["update"]>>>>;
