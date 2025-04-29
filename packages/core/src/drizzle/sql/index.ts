import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate as mig } from "drizzle-orm/neon-http/migrator";
import { drizzle as localDrizzle } from "drizzle-orm/postgres-js";
import { migrate as localMigrate } from "drizzle-orm/postgres-js/migrator";
import { Config, Context, Effect, Layer } from "effect";
import Pool from "pg-pool";
import postgres from "postgres";
import { Resource } from "sst";
import * as schema from "./schema";

export const database = () => {
  if (Resource.DatabaseProvider.value === "local") {
    const localClient = postgres(Resource.DatabaseUrl.value, { max: 1000 });
    return localDrizzle(localClient, { schema });
  } else {
    const client = neon(Resource.DatabaseUrl.value);
    return drizzle(client, {
      schema,
    });
  }
};

export const db = database();

export const migrate = async () => {
  const config = {
    migrationsFolder: join(process.cwd(), "drizzle/migrations"),
  };
  if (Resource.DatabaseProvider.value === "local") {
    console.log("Migrating local database: " + Resource.DatabaseUrl.value);
    const localClient = postgres(Resource.DatabaseUrl.value, { max: 1000 });
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
  effect: Effect.gen(function*(_) {
    return {
      instance: Effect.gen(function*(_) {
        if (Resource.DatabaseProvider.value === "local") {
          const localClient = postgres(Resource.DatabaseUrl.value, { max: 1000 });
          return localDrizzle(localClient, { schema });
        } else {
          const client = neon(Resource.DatabaseUrl.value);
          return drizzle(client, {
            schema,
          });
        }
      }),
      migrate: Effect.gen(function*(_) {
        const config = {
          migrationsFolder: join(process.cwd(), "drizzle/migrations"),
        };
        if (Resource.DatabaseProvider.value === "local") {
          console.log("Migrating local database: " + Resource.DatabaseUrl.value);
          const localClient = postgres(Resource.DatabaseUrl.value, { max: 1000 });
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
}) { }

export const DatabaseLive = DatabaseService.Default;
