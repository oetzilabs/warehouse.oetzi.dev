import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { migrate as mig } from "drizzle-orm/neon-http/migrator";
import { drizzle as localDrizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate as localMigrate } from "drizzle-orm/postgres-js/migrator";
import { Config, Console, Context, Effect, Layer, Redacted } from "effect";
import Pool from "pg-pool";
import postgres from "postgres";
import { WarehouseConfig, WarehouseConfigLive } from "../../entities/config";
import * as schema from "./schema";

// Fix for "sorry, too many clients already"
declare global {
  // eslint-disable-next-line no-var -- only var works here
  var globalClient: NeonHttpDatabase<typeof schema> | PostgresJsDatabase<typeof schema> | undefined;
}

let globalClient: NeonHttpDatabase<typeof schema> | PostgresJsDatabase<typeof schema> | undefined;

export class DatabaseService extends Effect.Service<DatabaseService>()("@warehouse/database", {
  effect: Effect.gen(function* (_) {
    const C = yield* _(WarehouseConfig);
    const config = yield* C.getConfig;

    return {
      instance: Effect.gen(function* (_) {
        if (global.globalClient) {
          return global.globalClient;
        }
        if (config.DatabaseProvider === "local") {
          const localClient = postgres(Redacted.value(config.DatabaseUrl), {
            max: 1000,
            onnotice(notice) {},
          });
          const db = localDrizzle(localClient, { schema, logger: false });
          global.globalClient = db;
        } else {
          const client = neon(Redacted.value(config.DatabaseUrl));
          const db = drizzle(client, {
            schema,
          });
          global.globalClient = db;
        }
        return global.globalClient;
      }),
      migrate: Effect.gen(function* (_) {
        const cfg = {
          migrationsFolder: join(process.cwd(), "drizzle/migrations"),
        };
        if (config.DatabaseProvider === "local") {
          console.log("Migrating local database: " + Redacted.value(config.DatabaseUrl));
          const localClient = postgres(Redacted.value(config.DatabaseUrl), { max: 1000, onnotice(notice) {} });
          const db = localDrizzle(localClient, { schema });
          return localMigrate(db, cfg);
        } else {
          console.log("Migrating PROD database: " + Redacted.value(config.DatabaseUrl));
          const client = neon(Redacted.value(config.DatabaseUrl));
          const db = drizzle(client, {
            schema,
          });
          return mig(db, cfg);
        }
      }),
    } as const;
  }),
  dependencies: [WarehouseConfigLive],
}) {}

export const DatabaseLive = DatabaseService.Default;
