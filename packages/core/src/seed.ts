import { BunRuntime } from "@effect/platform-bun";
import { Cause, Chunk, Effect, Exit } from "effect";
import { flatten } from "valibot";
import { BrandLive, BrandService } from "./entities/brands";
import { DeviceLive, DeviceService } from "./entities/devices";
import { SeedLive, SeedService } from "./entities/seed";
import { SeedingFailed } from "./entities/seed/errors";

const program2 = Effect.gen(function* (_) {
  const seedService = yield* _(SeedService);
  yield* seedService.seed();
}).pipe(Effect.provide(SeedLive));

async function run() {
  const exit = await Effect.runPromiseExit(program2);
  return Exit.match(exit, {
    onSuccess: () => {
      console.log("Seeding successful");
      process.exit(0);
    },
    onFailure: (cause) => {
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        if (c instanceof SeedingFailed) {
          return `Seeding failed: ${c.message}, via service: ${c.service}`;
        }
        // return c.message;
      });
      console.log(errors.join("\r\n\n"));
      process.exit(1);
    },
  });
}

run();
