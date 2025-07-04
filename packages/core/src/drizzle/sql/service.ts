import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import { Effect, Layer } from "effect";
import { WarehouseConfig, WarehouseConfigLive } from "../../entities/config";
import * as schema from "./schema";

const pgLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const C = yield* WarehouseConfig;
    const config = yield* C.getConfig;
    return PgClient.layer({ url: config.DatabaseUrl, onnotice(notice) {} });
  }).pipe(Effect.provide(WarehouseConfigLive)),
);

const drizzleLive = PgDrizzle.layer.pipe(Layer.provide(pgLive));
const dblive = Layer.mergeAll(pgLive, drizzleLive);

export class DatabaseService extends Effect.Service<DatabaseService>()("@warehouse/database", {
  effect: PgDrizzle.make({ schema }),
}) {
  static Client = this.Default.pipe(Layer.provide(dblive));
}

export const DatabaseLive = DatabaseService.Client;
