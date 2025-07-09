import { Command, FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { PlatformError } from "@effect/platform/Error";
import { cmdExec } from "@warehouseoetzidev/core/src/entities/cmd";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
import { Effect, Schema } from "effect";
import { ZipFile } from "yazl";

const EntrypointId = Schema.String.pipe(Schema.brand("@warehouseo/entrypoint"));

const DependenciesSchema = Schema.Array(EntrypointId);

const EntrypointSchema = Schema.Struct({
  id: EntrypointId,
  dependsOn: DependenciesSchema,
  outputs: Schema.Array(Schema.String),
});

type Entrypoint = typeof EntrypointSchema.Type;

const zipFolder = Effect.fn("@warehouse/build/zipFolder")(function* (folderPath: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const zip = new ZipFile();
  const chunks: Buffer[] = [];

  function addFilesFrom(zip: ZipFile, current: string, base = ""): Effect.Effect<void, Error | PlatformError, never> {
    return Effect.gen(function* (_) {
      const entries = yield* fs.readDirectory(current);

      for (const entry of entries) {
        const fullPath = path.join(current, entry);
        const relPath = path.join(base, entry);
        const stats = yield* fs.stat(fullPath);
        if (stats.type === "Directory") {
          yield* addFilesFrom(zip, fullPath, relPath);
        } else if (stats.type === "File") {
          zip.addFile(fullPath, relPath);
        }
      }
    });
  }

  yield* addFilesFrom(zip, folderPath);
  zip.end();

  return yield* Effect.async<Buffer, Error, never>((resume) => {
    zip.outputStream.on("data", (chunk) => chunks.push(chunk));
    zip.outputStream.on("end", () => resume(Effect.succeed(Buffer.concat(chunks))));
    zip.outputStream.on("error", (err) => resume(Effect.fail(err)));
  });
});

const walk = (dir: string): Effect.Effect<string[], Error | PlatformError, FileSystem.FileSystem | Path.Path> =>
  Effect.gen(function* (_) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const entries = yield* fs.readDirectory(dir);
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = yield* fs.stat(fullPath);
      if (stats.type === "Directory" && !entry.startsWith(".")) {
        const subFiles = yield* Effect.suspend(() => walk(fullPath));
        files.push(...subFiles);
      } else if (entry === "package.json") {
        files.push(fullPath);
      }
    }
    return files;
  });

const findPackages = Effect.fn("@warehouse/build/findPackages")(function* (root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const packages: Record<string, string> = {};

  const files = yield* walk(root);
  for (const file of files) {
    try {
      const pkgRaw = yield* fs.readFileString(file);
      const pkg = JSON.parse(pkgRaw);
      if (pkg.name) {
        packages[pkg.name] = path.dirname(file);
      }
    } catch {}
  }
  return packages;
});

export const program = Effect.fn("@warehouse/build/fn")(
  function* (entrypoints: Entrypoint[]) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const packageDirs = yield* findPackages(process.cwd());
    const bc = yield* Effect.forEach(
      entrypoints
        .filter((entrypoint) => entrypoint.dependsOn.length === 0)
        .map((entrypoint) => {
          const pkgDir = packageDirs[entrypoint.id];
          if (!pkgDir) throw new Error(`Could not find package.json for ${entrypoint.id}`);
          return {
            name: entrypoint.id,
            outputs: entrypoint.outputs,
            pkgDir,
            command: Command.make(process.execPath, ...[`--filter=${entrypoint.id}`, "run", "build"]).pipe(
              Command.workingDirectory(pkgDir),
            ),
          };
        }),
      (bc) =>
        Effect.gen(function* () {
          const r = yield* cmdExec(bc.command);
          return {
            name: bc.name,
            outputs: bc.outputs,
            pkgDir: bc.pkgDir,
            result: r,
          };
        }),
    );

    const result = yield* Effect.all(
      bc.map((bc) =>
        Effect.gen(function* (_) {
          const ec = yield* bc.result.exitCode;
          return yield* Effect.succeed({
            name: bc.name,
            outputs: bc.outputs,
            pkgDir: bc.pkgDir,
            pid: bc.result.pid,
            ec,
            stdout: bc.result.stdout.join("\n"),
            stderr: bc.result.stderr.join("\n"),
          });
        }),
      ),
      {
        concurrency: entrypoints.filter((entrypoint) => entrypoint.dependsOn.length === 0).length,
      },
    );
    yield* fs.makeDirectory(".output", { recursive: true });
    yield* fs.writeFileString(".output/build-output.json", JSON.stringify(result, null, 2));
    const zipFiles = yield* Effect.forEach(
      result.flatMap((r) =>
        r.outputs.map((output) => ({
          name: `${r.name}/${output}`.replaceAll("@", "_at_").replaceAll("/", "-"),
          outputPath: path.join(r.pkgDir, output),
        })),
      ),
      ({ name, outputPath }) =>
        Effect.gen(function* (_) {
          const zipped = yield* zipFolder(outputPath);
          return { name, output: zipped };
        }),
    );
    yield* Effect.all(zipFiles.map((z) => fs.writeFile(".output/" + z.name + ".zip", z.output)));
    return result;
  },
  (effect) => effect.pipe(Effect.provide([BunContext.layer, createOtelLayer("@warehouse/build")]), Effect.scoped),
);

if (import.meta.path === Bun.main) {
  BunRuntime.runMain(
    program([
      {
        id: EntrypointId.make("@warehouseoetzidev/web"),
        dependsOn: [],
        outputs: [".output", ".vinxi"],
      },
    ]),
  );
} else {
  console.log("we currently don't support building in a non-main context");
}
