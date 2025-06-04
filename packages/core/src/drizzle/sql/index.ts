import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { migrate as mig } from "drizzle-orm/neon-http/migrator";
import { drizzle as localDrizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate as localMigrate } from "drizzle-orm/postgres-js/migrator";
import { Config, Context, Effect, Layer } from "effect";
import Pool from "pg-pool";
import postgres from "postgres";
import { Resource } from "sst";
import * as schema from "./schema";

// Fix for "sorry, too many clients already"
declare global {
  // eslint-disable-next-line no-var -- only var works here
  var globalClient: NeonHttpDatabase<typeof schema> | PostgresJsDatabase<typeof schema> | undefined;
}

let globalClient: NeonHttpDatabase<typeof schema> | PostgresJsDatabase<typeof schema> | undefined;

export const database = () => {
  if (global.globalClient) {
    return global.globalClient;
  }
  const client = neon(Resource.DatabaseUrl.value);
  globalClient = drizzle(client, {
    schema,
  });
  if (Resource.DatabaseProvider.value === "local") {
    const localClient = postgres(Resource.DatabaseUrl.value, { max: 1000, onnotice(notice) {} });
    globalClient = localDrizzle(localClient, { schema });
    global.globalClient = globalClient;
  }
  global.globalClient = globalClient;
  return globalClient;
};

export const db = database();

export const migrate = async () => {
  const config = {
    migrationsFolder: join(process.cwd(), "drizzle/migrations"),
  };
  if (Resource.DatabaseProvider.value === "local") {
    console.log("Migrating local database: " + Resource.DatabaseUrl.value);
    const localClient = postgres(Resource.DatabaseUrl.value, { max: 1000, onnotice(notice) {} });
    const db = localDrizzle(localClient, { schema });
    return localMigrate(db, config);
  } else {
    console.log("Migrating PROD database: " + Resource.DatabaseUrl.value);
    const client = neon(Resource.DatabaseUrl.value);
    const db = drizzle(client, {
      schema,
    });
    return mig(db, config);
  }
};

export class DatabaseService extends Effect.Service<DatabaseService>()("@warehouse/database", {
  effect: Effect.gen(function* (_) {
    return {
      instance: Effect.gen(function* (_) {
        if (global.globalClient) {
          return global.globalClient;
        }
        if (Resource.DatabaseProvider.value === "local") {
          const localClient = postgres(Resource.DatabaseUrl.value, { max: 1000, onnotice(notice) {} });
          const db = localDrizzle(localClient, { schema });
          global.globalClient = db;
        } else {
          const client = neon(Resource.DatabaseUrl.value);
          const db = drizzle(client, {
            schema,
          });
          global.globalClient = db;
        }
        return global.globalClient;
      }),
      migrate: Effect.gen(function* (_) {
        const config = {
          migrationsFolder: join(process.cwd(), "drizzle/migrations"),
        };
        if (Resource.DatabaseProvider.value === "local") {
          console.log("Migrating local database: " + Resource.DatabaseUrl.value);
          const localClient = postgres(Resource.DatabaseUrl.value, { max: 1000, onnotice(notice) {} });
          const db = localDrizzle(localClient, { schema });
          return localMigrate(db, config);
        } else {
          console.log("Migrating PROD database: " + Resource.DatabaseUrl.value);
          const client = neon(Resource.DatabaseUrl.value);
          const db = drizzle(client, {
            schema,
          });
          return mig(db, config);
        }
      }),
    } as const;
  }),
}) {}

export const DatabaseLive = DatabaseService.Default;
