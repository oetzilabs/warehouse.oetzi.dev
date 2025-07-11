import { Command } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Config, Effect } from "effect";
import { cmdExec } from "./entities/cmd";
import { createOtelLayer } from "./entities/otel";

export const migrateProgram = Effect.fn("@warehouse/database/migrate/fn")(
  function* () {
    const separator = process.platform === "win32" ? ";" : ":";
    const PathConfig = yield* Config.string("PATH").pipe(Config.withDefault(""));
    const PATH = PathConfig.split(separator)
      .filter((p) => !p.includes(" "))
      .join(separator);
    const env = Command.env({
      PATH,
    });
    const migrateCommandString = "run drizzle-kit migrate";
    const migrateCommand = Command.make(process.execPath, ...migrateCommandString.split(" ")).pipe(env);
    const p2 = yield* cmdExec(migrateCommand);
    const exitCode2 = yield* p2.exitCode;
    if (exitCode2 !== 0) {
      return yield* Effect.fail(new Error(`Failed to migrate: ${exitCode2}`));
    }
    return yield* Effect.succeed(true);
  },
  (effect) =>
    effect.pipe(Effect.provide([BunContext.layer, createOtelLayer("@warehouse/database/migrate")]), Effect.scoped),
);

if(import.meta.path === Bun.main){
  BunRuntime.runMain(migrateProgram());
}

