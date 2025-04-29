import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/sql/schema.ts",
  verbose: true,
  dialect: "postgresql",
  strict: true,
  dbCredentials: {
    url: Resource.DatabaseUrl.value,
  },
});
