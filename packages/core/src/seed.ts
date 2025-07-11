import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { createOtelLayer } from "./entities/otel";
import { SeedLive, SeedService } from "./entities/seed";

export const seedProgram = Effect.fn("@warehouse/database/seed/fn")(
  function* () {
    const seedService = yield* SeedService;
    return yield* seedService.seed();
  },
  (effect) =>
    effect.pipe(
      Effect.provide([createOtelLayer("@warehouse/database/seed"), SeedLive, BunContext.layer]),
      Effect.scoped,
    ),
);

if(import.meta.path === Bun.main){
  BunRuntime.runMain(seedProgram());
}

