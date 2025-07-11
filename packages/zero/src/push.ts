import { PostgresJSConnection, PushProcessor, ZQLDatabase } from "@rocicorp/zero/pg";
import { type AuthVerified } from "@warehouseoetzidev/core/src/entities/authentication";
import postgres from "postgres";
import { schema } from ".";
import { createMutators } from "./mutators";
import { must } from "./utils";

const processor = new PushProcessor(
  new ZQLDatabase(
    new PostgresJSConnection(
      postgres(must(process.env.ZERO_UPSTREAM_DB as string, "required env var ZERO_UPSTREAM_DB")),
    ),
    schema,
  ),
);

export async function handlePush(authData: AuthVerified | undefined, request: Request) {
  return await processor.process(createMutators(authData), request);
  // return await processor.process(createMutators(), request);
}
