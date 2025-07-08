import { Command } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Config, Effect } from "effect";
import { cmdExec } from "./entities/cmd";
import { createOtelLayer } from "./entities/otel";

export const generateProgram = Effect.fn("@warehouse/database/generate/fn")(
  function* () {
    const separator = process.platform === "win32" ? ";" : ":";
    const PathConfig = yield* Config.string("PATH").pipe(Config.withDefault(""));
    const PATH = PathConfig.split(separator)
      .filter((p) => !p.includes(" "))
      .join(separator);
    const env = Command.env({
      PATH,
    });
    const generateCommandString = "run drizzle-kit generate";
    const generateCommand = Command.make("bun", ...generateCommandString.split(" ")).pipe(env);
    const p1 = yield* cmdExec(generateCommand);
    const exitCode = yield* p1.exitCode;
    if (exitCode !== 0) {
      return yield* Effect.fail(new Error(`Failed to generate migrations: ${exitCode}`));
    }
    return yield* Effect.succeed(true);
  },
  (effect) =>
    effect.pipe(Effect.provide([BunContext.layer, createOtelLayer("@warehouse/database/migrate")]), Effect.scoped),
);

// BunRuntime.runMain(generateProgram());
