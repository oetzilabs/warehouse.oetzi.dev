import { Command, FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { PlatformError } from "@effect/platform/Error";
import { cmdExec } from "@warehouseoetzidev/core/src/entities/cmd";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
import { Glob } from "bun";
import { Console, Effect, Fiber, Queue, Schema } from "effect";
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

const EntrypointsArray = Schema.Array(EntrypointSchema);

const ProjectsJsonSchema = Schema.Struct({
  projects: EntrypointsArray,
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
  function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const projectsJson = yield* fs
      .readFileString(path.join(process.cwd(), "projects.json"))
      .pipe(Effect.catchTag("SystemError", (error) => Effect.die(error)));
    const { projects } = yield* Schema.decode(ProjectsJsonSchema)(JSON.parse(projectsJson));

    const packageDirs = yield* findPackages(process.cwd());

    // Remove each project's outputs before build
    for (const project of projects) {
      const pkgDir = packageDirs[project.entrypoint];
      if (!pkgDir) continue;
      for (const output of project.outputs) {
        const outputPath = path.join(pkgDir, output);
        yield* Effect.ignoreLogged(fs.remove(outputPath, { recursive: true, force: true }));
      }
    }

    // Build a map of project id to project
    const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

    // Topological sort
    function topoSort(projects: Readonly<Entrypoint[]>): Entrypoint[] {
      const visited = new Set<string>();
      const sorted: Entrypoint[] = [];
      function visit(p: Entrypoint) {
        if (visited.has(p.id)) return;
        visited.add(p.id);
        for (const dep of p.dependsOn) {
          if (projectMap[dep]) visit(projectMap[dep]);
        }
        sorted.push(p);
      }
      for (const p of projects) visit(p);
      return sorted;
    }

    const sortedProjects = topoSort(projects);
    yield* Console.dir(sortedProjects, { depth: 10 });

    // Prepare build commands in sorted order
    const bc = sortedProjects.map((project) => {
      const pkgDir = packageDirs[project.entrypoint];
      if (!pkgDir) throw new Error(`Could not find package.json for ${project.entrypoint}`);
      if (project.outputs.length === 0) throw new Error(`No outputs defined for ${project.entrypoint}`);
      return {
        name: project.entrypoint,
        id: project.id,
        dependsOn: project.dependsOn,
        outputs: project.outputs,
        pkgDir,
        command: cmdExec(
          Command.make(
            project.command
              ? ["bun", "node"].includes(project.command.split(" ")[0])
                ? process.execPath
                : project.command.split(" ")[0]
              : process.execPath,
            ...(project.command
              ? project.command.split(" ").slice(1)
              : [`--filter=${project.entrypoint}`, "run", project.script ?? "build"]),
          ).pipe(Command.workingDirectory(pkgDir)),
          true, // ignore logs
        ),
      };
    });

    // Use Effect Queue for dependency-aware concurrency
    const buildResults: Record<string, any> = {};
    const completed = new Set<string>();
    const enqueued = new Set<string>();
    const fibers: Fiber.Fiber<any, void>[] = [];

    // Map id to build for quick lookup
    const buildMap = Object.fromEntries(bc.map((b) => [b.id, b]));

    // Track which builds are pending
    let pending = new Set(bc.map((b) => b.id));

    // Create an unbounded queue for ready builds
    const queue = yield* Queue.unbounded<(typeof bc)[0]>();

    // Enqueue all builds with no dependencies (only once)
    for (const build of bc) {
      if (build.dependsOn.length === 0 && !enqueued.has(build.id)) {
        yield* Queue.offer(queue, build);
        enqueued.add(build.id);
      }
    }

    // Helper to enqueue builds whose dependencies are now satisfied (only once)
    const enqueueReadyBuilds = Effect.fn("@warehouse/build/enqueueReadyBuilds")(function* () {
      for (const id of pending) {
        const build = buildMap[id];
        if (!completed.has(id) && !enqueued.has(id) && build.dependsOn.every((dep) => completed.has(dep))) {
          yield* Queue.offer(queue, build);
          enqueued.add(id);
        }
      }
    });

    // Main loop: only fork a fiber when a build is available in the queue
    while (completed.size < bc.length) {
      const build = yield* Queue.take(queue);
      const fiber = yield* Effect.fork(
        Effect.gen(function* (_) {
          yield* Effect.log(`Running ${build.name} (${build.id})`);
          const c = yield* build.command;
          const ec = yield* c.exitCode;
          buildResults[build.id] = {
            name: build.name,
            outputs: build.outputs,
            pkgDir: build.pkgDir,
            pid: c.pid,
            ec,
            stdout: c.stdout.join("\n"),
            stderr: c.stderr.join("\n"),
          };
          completed.add(build.id);
          pending.delete(build.id);
          yield* Effect.log(`Finished ${build.name} (${build.id})`);
          // Enqueue any builds whose dependencies are now satisfied
          yield* enqueueReadyBuilds();
        }).pipe(Effect.catchAll(() => Effect.succeed<void>(undefined))),
      );
      fibers.push(fiber);
    }

    // Wait for all fibers to finish
    yield* Effect.forEach(fibers, (fiber) => Fiber.join(fiber));

    const result = Object.values(buildResults);

    yield* fs.makeDirectory(".warehouse/output", { recursive: true });
    yield* fs.writeFileString(".warehouse/build-output.json", JSON.stringify(result, null, 2));
    const zipFiles = yield* Effect.forEach(
      result.flatMap((r: any) =>
        r.outputs.map((output: string) => ({
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

if (import.meta.path === Bun.main) {
  BunRuntime.runMain(program());
} else {
  BunRuntime.runMain(
    Effect.gen(function* () {
      yield* Console.log("we currently don't support building in a non-main context");
      return void 0;
    }),
  );
}
