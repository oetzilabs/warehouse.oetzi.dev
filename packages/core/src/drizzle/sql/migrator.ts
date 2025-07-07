import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import { Effect, identity, Layer, String } from "effect";
import { WarehouseConfig, WarehouseConfigLive } from "../../entities/config";
import * as schema from "./schema";

const pgLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const C = yield* WarehouseConfig;
    const config = yield* C.getConfig;
    return PgClient.layer({
      url: config.DatabaseUrl,
      onnotice(notice) {},
      transformQueryNames: String.camelToSnake,
      transformResultNames: String.snakeToCamel,
      types: {
        // - 114: JSON (return as string instead of parsed object)
        // - 1082: DATE
        // - 1114: TIMESTAMP WITHOUT TIME ZONE
        // - 1184: TIMESTAMP WITH TIME ZONE
        // - 3802: JSONB (return as string instead of parsed object)
        114: {
          to: 25,
          from: [114],
          parse: identity,
          serialize: identity,
        },
        1082: {
          to: 25,
          from: [1082],
          parse: identity,
          serialize: identity,
        },
        1114: {
          to: 25,
          from: [1114],
          parse: identity,
          serialize: identity,
        },
        1184: {
          to: 25,
          from: [1184],
          parse: identity,
          serialize: identity,
        },
        3802: {
          to: 25,
          from: [3802],
          parse: identity,
          serialize: identity,
        },
      },
    });
  }).pipe(Effect.provide(WarehouseConfigLive)),
);

const drizzleLive = PgDrizzle.layer.pipe(Layer.provide(pgLive));
const dblive = Layer.mergeAll(pgLive, drizzleLive);

export class DatabaseMigratorService extends Effect.Service<DatabaseMigratorService>()("@warehouse/database/migrator", {
  effect: PgDrizzle.make({ schema }),
}) {
  static Client = this.Default.pipe(Layer.provide(dblive));
}

export const DatabaseMigratorLive = DatabaseMigratorService.Client;
