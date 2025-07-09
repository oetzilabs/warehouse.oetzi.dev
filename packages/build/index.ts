import { Command, FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { PlatformError } from "@effect/platform/Error";
import { cmdExec } from "@warehouseoetzidev/core/src/entities/cmd";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
import { Glob } from "bun";
import { Effect, Schema } from "effect";
import { ZipFile } from "yazl";

const DependenciesSchema = Schema.Array(Schema.String);

export const EntrypointSchema = Schema.Struct({
  id: Schema.String,
  entrypoint: Schema.String,
  dependsOn: DependenciesSchema,
  script: Schema.optional(Schema.String),
  command: Schema.optional(Schema.String),
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

const findPackages = Effect.fn("@warehouse/build/findPackages")(function* (root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const packages: Record<string, string> = {};
  const glob = new Glob("**/package.json");
  const files = Array.from(glob.scanSync(root));
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
    const bc = entrypoints
      .filter((entrypoint) => entrypoint.dependsOn.length === 0)
      .map((entrypoint) => {
        const pkgDir = packageDirs[entrypoint.entrypoint];
        if (!pkgDir) throw new Error(`Could not find package.json for ${entrypoint.entrypoint}`);
        if (entrypoint.outputs.length === 0) throw new Error(`No outputs defined for ${entrypoint.entrypoint}`);
        return {
          name: entrypoint.entrypoint,
          outputs: entrypoint.outputs,
          pkgDir,
          command: cmdExec(
            Command.make(
              entrypoint.command
                ? ["bun", "node"].includes(entrypoint.command.split(" ")[0])
                  ? process.execPath
                  : entrypoint.command.split(" ")[0]
                : process.execPath,
              ...(entrypoint.command
                ? entrypoint.command.split(" ").slice(1)
                : [`--filter=${entrypoint.entrypoint}`, "run", entrypoint.script ?? "build"]),
            ).pipe(Command.workingDirectory(pkgDir)),
          ),
        };
      });

    const result = yield* Effect.all(
      bc.map((bc) =>
        Effect.gen(function* (_) {
          const c = yield* bc.command;
          const ec = yield* c.exitCode;
          return yield* Effect.succeed({
            name: bc.name,
            outputs: bc.outputs,
            pkgDir: bc.pkgDir,
            pid: c.pid,
            ec,
            stdout: c.stdout.join("\n"),
            stderr: c.stderr.join("\n"),
          });
        }),
      ),
      {
        concurrency: entrypoints.filter((entrypoint) => entrypoint.dependsOn.length === 0).length,
      },
    );
    yield* fs.makeDirectory(".warehouse/output", { recursive: true });
    yield* fs.writeFileString(".warehouse/build-output.json", JSON.stringify(result, null, 2));
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
    yield* Effect.all(zipFiles.map((z) => fs.writeFile(".warehouse/output/" + z.name + ".zip", z.output)));
    return result;
  },
  (effect) => effect.pipe(Effect.provide([BunContext.layer, createOtelLayer("@warehouse/build")]), Effect.scoped),
);
