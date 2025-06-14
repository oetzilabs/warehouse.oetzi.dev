import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { AddressCreateSchema, AddressUpdateSchema, TB_addresses } from "../../drizzle/sql/schemas/address";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { AddressInvalidId, AddressNotDeleted, AddressNotFound, AddressNotUpdated } from "./errors";

export class AddressService extends Effect.Service<AddressService>()("@warehouse/addresses", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_addresses.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        organizations: true,
        warehouses: true,
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (userInput: InferInput<typeof AddressCreateSchema>) =>
      Effect.gen(function* (_) {
        const [address] = yield* Effect.promise(() => db.insert(TB_addresses).values(userInput).returning());
        return address;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new AddressInvalidId({ id }));
        }

        const result = yield* Effect.promise(() =>
          db.query.TB_addresses.findFirst({
            where: (addresses, { eq }) => eq(addresses.id, parsedId.output),
            with: relations,
          }),
        );

        if (!result) {
          return yield* Effect.fail(new AddressNotFound({ id }));
        }

        return result;
      });

    const findByLatLon = (lat_lon: [number, number]) =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_addresses.findFirst({
            where: (addresses, operations) =>
              operations.and(operations.eq(addresses.lat, lat_lon[0]), operations.eq(addresses.lon, lat_lon[1])),
          }),
        );
      });

    const update = (input: InferInput<typeof AddressUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new AddressInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_addresses)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_addresses.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new AddressNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new AddressInvalidId({ id }));
        }

        const result = yield* Effect.promise(() =>
          db
            .delete(TB_addresses)
            .where(eq(TB_addresses.id, parsedId.output))
            .returning()
            .then(([x]) => x),
        );

        if (!result) {
          return yield* Effect.fail(new AddressNotDeleted({ id }));
        }

        return result;
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_addresses.findMany());
      });

    return {
      create,
      findById,
      findByLatLon,
      update,
      remove,
      all,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const AddressLive = AddressService.Default;

// Type exports
export type Frontend = NonNullable<Awaited<ReturnType<AddressService["findById"]>>>;
