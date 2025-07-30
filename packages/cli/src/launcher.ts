#!/usr/bin/env bun
import { CliConfig, Command as EffectCliCommand } from "@effect/cli"; // Renamed to avoid conflict
import { FileSystem, HttpClient, Path, Terminal } from "@effect/platform";
import { BunContext, BunFileSystem, BunPath, BunRuntime, BunTerminal } from "@effect/platform-bun";
import { DownloaderLive, DownloaderService } from "@warehouseoetzidev/core/src/entities/downloader";
import { Cause, Config, Console, Context, Data, Effect, Layer, Option, pipe, Schema } from "effect";

const CLI_NAME = "wh" as const;

const LauncherConfigSchema = Schema.Struct({
  activeVersion: Schema.Option(Schema.NullishOr(Schema.String)),
});

type LauncherConfig = typeof LauncherConfigSchema.Type;

const DEFAULT_CONFIG: LauncherConfig = {
  activeVersion: Option.some(null),
};

const ensureConfig = Effect.fn("@warehouse/cli/config.ensure")(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const dir = yield* Config.string("HOME");
  const whDir = path.join(dir, ".wh");
  const configFile = path.join(whDir, "warehouse-cli.json");
  const exists = yield* fs.exists(configFile);
  if (!exists) {
    // create the folder if it doesn't exist
    yield* fs.makeDirectory(whDir, { recursive: true });
    yield* fs.writeFileString(configFile, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
  return yield* Effect.succeed(configFile);
});

const loadConfig = Effect.fn("@warehouse/cli/config.load")(function* () {
  const fs = yield* FileSystem.FileSystem;
  const configFile = yield* ensureConfig();
  const content = yield* fs.readFileString(configFile);
  const decoded = yield* Schema.decode(LauncherConfigSchema)(JSON.parse(content));
  return yield* Effect.succeed(decoded);
});

const saveConfig = Effect.fn("@warehouse/cli/config.save")(function* (configFile: string, config: LauncherConfig) {
  const fs = yield* FileSystem.FileSystem;
  const encoded = yield* Schema.encode(LauncherConfigSchema)(config);
  yield* fs.writeFileString(configFile, JSON.stringify(encoded, null, 2));
});

const downloadCliBundle = Effect.fn("@warehouse/cli/downloadCliBundle")(function* (version: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const configDir = yield* Config.string("HOME");
  const whDir = path.join(configDir, ".wh");
  const CLI_REPOSITORY_URL = yield* Config.string("CLI_REPOSITORY_URL");
  const versionsDir = path.join(whDir, "versions");
  const bundleName = `${CLI_NAME}-${version}.js`;
  const bundlePath = path.join(versionsDir, bundleName);

  const exists = yield* fs.exists(bundlePath);
  if (exists) {
    yield* Console.log(`Version ${version} already downloaded.`);
    return bundlePath;
  }

  yield* Console.log(`Downloading CLI version ${version} from: ${CLI_REPOSITORY_URL}...`);
  const downloader = yield* DownloaderService;
  const downloadUrl = `${CLI_REPOSITORY_URL}/${version}/${bundleName}`;
  const targetFolder = yield* fs.makeDirectory(versionsDir, { recursive: true });
  const downloadedPath = yield* downloader.download(downloadUrl, targetFolder, "buffer");
  yield* fs.rename(downloadedPath, bundlePath);
  return bundlePath;
});

const executeCliBundle = Effect.fn("@warehouse/cli/executeCliBundle")(function* (bundlePath: string, args: string[]) {
  const path = yield* Path.Path;
  const cli = yield* Effect.tryPromise({
    try: () => import(bundlePath) as Promise<{ default: (args: string[]) => void; cli: (args: string[]) => void }>,
    catch: (e) => Effect.fail(new Error(`Failed to import the CLI bundle: ${e}`)),
  });
  return cli.default(args);
});

const cli = Effect.fn("@warehouse/cli/fn")(function* (args: string[]) {
  const path = yield* Path.Path;
  const config = yield* loadConfig();
  const version = Option.getOrElse(config.activeVersion, () => "latest");
  const node_env = yield* Config.string("NODE_ENV").pipe(Config.withDefault("production"));
  yield* Console.log(`Running CLI version ${version} in NODE_ENV: ${node_env}`);
  if (node_env !== "production") {
    return yield* executeCliBundle(path.join(process.cwd(), "src/index.ts"), args);
  }
  yield* Console.log(`Running CLI version ${version}`);
  const bundlePath = yield* downloadCliBundle(version!);
  return yield* executeCliBundle(bundlePath, args);
});

if (import.meta.path === Bun.main) {
  cli(Bun.argv).pipe(Effect.provide([DownloaderLive, BunContext.layer]), BunRuntime.runMain);
}
