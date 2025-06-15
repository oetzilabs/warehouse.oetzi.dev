import { Command } from "@effect/platform";
import { Effect, pipe, Stream } from "effect";

export const run_command = (com: Command.Command, ignore_logging: boolean = false) =>
  Effect.gen(function* (_) {
    const _process = yield* pipe(
      Command.start(com),
      Effect.flatMap((_process) =>
        Effect.gen(function* (_) {
          const stdoutStream = _process.stdout.pipe(Stream.decodeText("utf8"));
          const stderrStream = _process.stderr.pipe(Stream.decodeText("utf8"));

          yield* stdoutStream.pipe(
            Stream.runForEach((line) => (ignore_logging ? Effect.void : Effect.log(line))),
            Effect.fork,
          );

          yield* stderrStream.pipe(
            Stream.runForEach((line) => (ignore_logging ? Effect.void : Effect.logError(line))),
            Effect.fork,
          );
          return _process;
        }),
      ),
    );
    return _process;
  });
