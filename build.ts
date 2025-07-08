import { Command } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { cmdExec } from "@warehouseoetzidev/core/src/entities/cmd";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
import { Config, Effect } from "effect";

export const program = Effect.fn("@warehouse/web/build/fn")(
  function* () {
    const separator = process.platform === "win32" ? ";" : ":";
    const PathConfig = yield* Config.string("PATH").pipe(Config.withDefault(""));
    const PATH = PathConfig.split(separator)
      .filter((p) => !p.includes(" "))
      .join(separator);
    const env = Command.env({
      PATH,
    });
    const buildCommand = Command.make("bun", ...["--filter=@warehouseoetzidev/web", "run", "build"]).pipe(env);
    const p = yield* cmdExec(buildCommand);
    const eC = yield* p.exitCode;
    return yield* Effect.succeed(eC);
  },
  (effect) => effect.pipe(Effect.provide([BunContext.layer, createOtelLayer("@warehouse/web/build")]), Effect.scoped),
);

BunRuntime.runMain(program());
