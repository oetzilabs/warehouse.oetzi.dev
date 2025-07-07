import { Command } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Config, Effect } from "effect";
import { DatabaseMigratorLive, DatabaseMigratorService } from "./drizzle/sql/migrator";
import { cmdExec } from "./entities/cmd";
import { createOtelLayer } from "./entities/otel";

const program = Effect.gen(function* (_) {
  const separator = process.platform === "win32" ? ";" : ":";
  const PathConfig = yield* Config.string("PATH").pipe(Config.withDefault(""));
  const PATH = PathConfig.split(separator)
    .filter((p) => !p.includes(" "))
    .join(separator);
  const env = Command.env({
    PATH,
  });
  const generateCommandString = "run drizzle-kit generate";
  const migrateCommandString = "run drizzle-kit migrate";
  const generateCommand = Command.make("bun", ...generateCommandString.split(" ")).pipe(env);
  const migrateCommand = Command.make("bun", ...migrateCommandString.split(" ")).pipe(env);
  const p1 = yield* cmdExec(generateCommand);
  const exitCode = yield* p1.exitCode;
  if (exitCode !== 0) {
    return yield* Effect.fail(new Error(`Failed to generate migrations: ${exitCode}`));
  }
  const p2 = yield* cmdExec(migrateCommand);
  const exitCode2 = yield* p2.exitCode;
  if (exitCode2 !== 0) {
    return yield* Effect.fail(new Error(`Failed to migrate: ${exitCode2}`));
  }
  return yield* Effect.succeed(true);
}).pipe(
  Effect.provide([DatabaseMigratorLive, BunContext.layer, createOtelLayer("@warehouse/database/migrate")]),
  Effect.scoped,
);

BunRuntime.runMain(program);
