import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { AddressCreateSchema, AddressUpdateSchema, TB_addresses } from "../../drizzle/sql/schemas/address";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { AddressInvalidId, AddressNotDeleted, AddressNotFound, AddressNotUpdated } from "./errors";

export class AddressService extends Effect.Service<AddressService>()("@warehouse/addresses", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;

    const create = Effect.fn("@warehouse/addresses/create")(function* (
      userInput: InferInput<typeof AddressCreateSchema>,
    ) {
      const [address] = yield* db.insert(TB_addresses).values(userInput).returning();
      return address;
    });

    const findById = Effect.fn("@warehouse/addresses/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new AddressInvalidId({ id }));
      }

      const result = yield* db.query.TB_addresses.findFirst({
        where: (addresses, { eq }) => eq(addresses.id, parsedId.output),
        with: {
          organizations: true,
          warehouses: true,
        },
      });

      if (!result) {
        return yield* Effect.fail(new AddressNotFound({ id }));
      }

      return result;
    });

    const findByLatLon = Effect.fn("@warehouse/addresses/findByLatLon")(function* (lat_lon: [number, number]) {
      return yield* db.query.TB_addresses.findFirst({
        where: (addresses, operations) =>
          operations.and(operations.eq(addresses.lat, lat_lon[0]), operations.eq(addresses.lon, lat_lon[1])),
      });
    });

    const update = Effect.fn("@warehouse/addresses/update")(function* (input: InferInput<typeof AddressUpdateSchema>) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new AddressInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_addresses)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_addresses.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new AddressNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/addresses/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new AddressInvalidId({ id }));
      }

      const [result] = yield* db.delete(TB_addresses).where(eq(TB_addresses.id, parsedId.output)).returning();

      if (!result) {
        return yield* Effect.fail(new AddressNotDeleted({ id }));
      }

      return result;
    });

    const all = Effect.fn("@warehouse/addresses/all")(function* () {
      return yield* db.query.TB_addresses.findMany();
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
