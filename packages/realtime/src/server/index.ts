import { BunRuntime } from "@effect/platform-bun";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
import { Effect } from "effect";
import { program } from "./program";

BunRuntime.runMain(
  Effect.gen(function* () {
    return yield* Effect.scoped(program()).pipe(Effect.provide([createOtelLayer("@warehouse/realtime/server")]));
  }),
);

export {};
