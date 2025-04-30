import { migrate } from "@warehouseoetzidev/core/src/drizzle/sql";
import { ApiHandler, json } from "./utils";

export const handler = ApiHandler(async (_evt) => {
  await migrate().catch((e) => {
    // full error
    console.error(JSON.stringify(e, null, 2));
    throw e;
  });

  return json({
    body: "Migrated!",
  });
});
