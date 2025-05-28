import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunFileSystem, BunRuntime } from "@effect/platform-bun";
import { toJSONSchema, ToJSONSchemaOptions } from "@gcornut/valibot-json-schema";
import { Cause, Chunk, Console, Effect, Exit } from "effect";
import { object, string } from "valibot";
import { SeedDataSchema } from "./entities/seed/schema";

const program2 = Effect.gen(function* (_) {
  const fs = yield* _(FileSystem.FileSystem);
  const path = yield* _(Path.Path);
  const options = {
    strictObjectTypes: true,
    dateStrategy: "string",
    ignoreUnknownValidation: true,
    customSchemaConversion: {
      custom: () => ({}),
      instance: () => ({}),
      file: () => ({}),
      blob: () => ({}),
    },
  } satisfies ToJSONSchemaOptions;
  const schema = toJSONSchema({
    ...options,
    // @ts-ignore
    schema: object({ ...SeedDataSchema.entries, $schema: string() }),
  });
  const p = path.join(process.cwd(), "./src/data/schema.json");
  yield* Console.log(`Writing schema to ${p}`);
  yield* fs.writeFileString(path.join(process.cwd(), "./src/data/schema.json"), JSON.stringify(schema, null, 2)).pipe(
    Effect.catchTags({
      BadArgument: (e) => Effect.fail(new Error(`Failed to write schema to ${p}: ${e.message}`)),
      SystemError: (e) => Effect.fail(new Error(`Failed to write schema to ${p}: ${e.message}`)),
    }),
  );
  yield* Console.log("Schema written successfully");
  return true;
}).pipe(Effect.provide(BunFileSystem.layer), Effect.provide(BunContext.layer));

BunRuntime.runMain(Effect.scoped(program2));
