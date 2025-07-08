import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { createOtelLayer } from "./entities/otel";
import { generateProgram } from "./generate";
import { migrateProgram } from "./migrate";
import { seedProgram } from "./seed";

const program = Effect.gen(function* (_) {
  const tasks = yield* Effect.all([generateProgram(), migrateProgram(), seedProgram()]);
  return yield* Effect.succeed(true);
}).pipe(Effect.provide(createOtelLayer("@warehouse/database/migrate")));

BunRuntime.runMain(program);
