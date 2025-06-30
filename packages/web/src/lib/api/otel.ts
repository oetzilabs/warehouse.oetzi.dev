import { action, json } from "@solidjs/router";
import { Effect, Schema } from "effect";
import { run } from "./utils";

class OtelTriggerError extends Schema.TaggedError<OtelTriggerError>()("OtelTriggerError", {}) {}

export const triggerError = action((name: string) => {
  "use server";
  return run(
    "@action/trigger-otel-error",
    Effect.gen(function* (_) {
      yield* Effect.annotateCurrentSpan("ranBy", name);
      throw new Error("OtelTriggerError");
      return yield* Effect.fail(OtelTriggerError);
    }),
    json(undefined),
  );
});

export const triggerSuccess = action((name: string) => {
  "use server";
  return run(
    "@action/trigger-otel-success",
    Effect.gen(function* (_) {
      yield* Effect.annotateCurrentSpan("ranBy", name);
      return yield* Effect.succeed(true);
    }),
    json(false),
  );
});
