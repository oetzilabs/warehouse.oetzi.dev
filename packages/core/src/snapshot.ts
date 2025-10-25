import { BunContext } from "@effect/platform-bun";
import { Cause, Chunk, Effect, Exit } from "effect";
import { SnapshotLive, SnapshotService } from "./entities/snapshot";

const backupProgram = Effect.scoped(
  Effect.gen(function* () {
    const snapshotService = yield* SnapshotService;
    return yield* snapshotService.backup("json");
  }).pipe(Effect.provide([SnapshotLive, BunContext.layer])),
).pipe(
  Effect.catchTags({
    ConfigError: (error) => Effect.fail(new Error(`ConfigError`, { cause: error })),
    SystemError: (error) => Effect.fail(new Error(error.message)),
    BadArgument: (error) => Effect.fail(new Error(error.message)),
  }),
);

const recoverProgram = Effect.scoped(
  Effect.gen(function* () {
    const snapshotService = yield* SnapshotService;
    const previous = yield* snapshotService.getPreviousSnapshot();
    return yield* snapshotService.recover(previous);
  }).pipe(Effect.provide([SnapshotLive, BunContext.layer])),
).pipe(
  Effect.catchTags({
    ConfigError: (error) => Effect.fail(new Error(`ConfigError`, { cause: error })),
    PreviousSnapshotNotFound: (error) => Effect.fail(new Error(error.message)),
    SnapshotNotFound: (error) => Effect.fail(new Error(error.message)),
    SnapshotInvalidType: (error) => Effect.fail(new Error(error.message)),
    SnapshotNotImplemented: (error) => Effect.fail(new Error(error.message)),
    SnapshotValidationFailed: (error) => Effect.fail(new Error(error.message)),
    SystemError: (error) => Effect.fail(new Error(error.message)),
    BadArgument: (error) => Effect.fail(new Error(error.message)),
  }),
);

async function run() {
  const type = process.argv[2];
  const subcommands = ["backup", "recover", "help", "list"];
  if (subcommands.indexOf(type) === -1) {
    console.log("This subcommand is not supported");
    console.log(
      `Valid subcommands are:
${subcommands.map((t) => `  - ${t}`).join("\n")}
`,
    );
    process.exit(1);
  }
  switch (type) {
    case "backup":
      return Exit.match(await Effect.runPromiseExit(backupProgram), {
        onSuccess: () => {
          console.log("Seeding successful");
          process.exit(0);
        },
        onFailure: (cause) => {
          const causes = Cause.failures(cause);
          const errors = Chunk.toReadonlyArray(causes).map((c) => {
            return c.message;
          });
          console.log(errors.join("\r\n\n"));
          process.exit(1);
        },
      });
      break;
    case "recover":
      Exit.match(await Effect.runPromiseExit(recoverProgram), {
        onSuccess: () => {
          console.log("Seeding successful");
          process.exit(0);
        },
        onFailure: (cause) => {
          const causes = Cause.failures(cause);
          const errors = Chunk.toReadonlyArray(causes).map((c) => {
            return c.message;
          });
          console.log(errors.join("\r\n\n"));
          process.exit(1);
        },
      });
      break;
    default:
      console.log("Invalid type");
      process.exit(1);
      break;
  }
}

run();
