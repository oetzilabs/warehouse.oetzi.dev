import { Command, FileSystem, Path } from "@effect/platform";
import { BunContext, BunFileSystem, BunRuntime } from "@effect/platform-bun";
import { Config, Effect } from "effect";
import { run_command } from "../utils";
import { BuildCommandFailed } from "./errors";

//bun build --outfile=dist/release/x64/main ./src/index.ts --compile --minify --target=bun-linux-x64
class BuildService extends Effect.Service<BuildService>()("@warehouse/printers/build", {
  effect: Effect.gen(function* (_) {
    const fs = yield* _(FileSystem.FileSystem);
    const path = yield* _(Path.Path);
    const compileTargets = {
      linux: ["x64", "arm64"] as const,
    } as const;
    const separator = process.platform === "win32" ? ";" : ":";
    const PathConfig = yield* Config.string("PATH").pipe(Config.withDefault(""));
    const PATH = PathConfig.split(separator)
      .filter((p) => !p.includes(" "))
      .join(separator);
    const env = Command.env({
      PATH,
    });

    const build = <P extends keyof typeof compileTargets>(platform: P, target: (typeof compileTargets)[P][number]) =>
      Effect.gen(function* (_) {
        const targetName = `${platform}-${target}`;
        const outfile = path.join(process.cwd(), "dist", "release", targetName, "main");
        const cmd = Command.make(
          "bun",
          "build",
          "--outfile",
          outfile,
          "./src/target/bun.ts",
          "--compile",
          "--minify",
          "--target",
          `bun-${platform}-${target}`,
        );
        const _process = yield* run_command(cmd.pipe(env));
        const exit = yield* _process.exitCode;
        if (exit !== 0) {
          return Effect.fail(new BuildCommandFailed({ message: `Failed to build for ${targetName}`, cause: exit }));
        }
        return Effect.succeed(outfile);
      });

    const clearDistFolder = () =>
      Effect.gen(function* (_) {
        const dist = path.join(process.cwd(), "dist");
        yield* fs.remove(dist, { recursive: true, force: true });
      });

    const buildAll = (platform: keyof typeof compileTargets, clear: boolean = true) =>
      Effect.gen(function* (_) {
        if (clear) {
          yield* clearDistFolder();
        }
        return yield* Effect.all(compileTargets[platform].map((target) => build(platform, target)));
      });

    return {
      build,
      buildAll,
    } as const;
  }),
  dependencies: [],
}) {}

export const BuildLive = BuildService.Default;

export const program = Effect.scoped(
  Effect.gen(function* (_) {
    const builder = yield* _(BuildService);
    return yield* builder.buildAll("linux");
  }).pipe(Effect.provide(BuildLive), Effect.provide(BunFileSystem.layer), Effect.provide(BunContext.layer)),
);

BunRuntime.runMain(program);
