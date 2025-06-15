import { action, json, query, redirect } from "@solidjs/router";
import { RealtimeLive, RealtimeService } from "@warehouseoetzidev/core/src/entities/realtime";
import { Cause, Chunk, Effect, Exit } from "effect";
import { withSession } from "./session";

export const testPrint = action(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const program = Effect.gen(function* (_) {
    const rtService = yield* _(RealtimeService);
    yield* rtService.publish("print", "create", { message: "testtest" });

    return {};
  }).pipe(Effect.provide(RealtimeLive));

  const productExit = await Effect.runPromiseExit(program);

  return Exit.match(productExit, {
    onSuccess: (prods) => {
      return json(prods);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
});
