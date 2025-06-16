import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { RealtimeLive, RealtimeService } from "@warehouseoetzidev/core/src/entities/realtime";
import { Cause, Chunk, Console, Effect, Exit } from "effect";
import { Resource } from "sst";
import { realtime } from "sst/aws/realtime";

export const handler = realtime.authorizer(async (token) => {
  if (!token) {
    console.log("No token");
    return {
      subscribe: [] as string[],
      publish: [] as string[],
    };
  }

  const prefix = `${Resource.App.name}/${Resource.App.stage}/` as const;

  const program = Effect.gen(function* (_) {
    const realtime = yield* _(RealtimeService);
    if (token === "local") {
      const topics = yield* realtime.createTopics(prefix, token);
      return topics;
    }
    const orgService = yield* _(OrganizationService);
    const org = yield* orgService.findById(token);
    return yield* realtime.createTopics(prefix, org.id);
  }).pipe(Effect.provide(RealtimeLive), Effect.provide(OrganizationLive));

  const exit = await Effect.runPromiseExit(program);
  const result = Exit.match(exit, {
    onSuccess: (data) => data,
    onFailure: (cause) => {
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return `${c._tag}: ${c.message}`;
      });
      const messages = errors.join(", ");
      console.error("Realtime failed:", messages);
      return {
        subscribe: [] as string[],
        publish: [] as string[],
      };
    },
  });
  console.log({ token, result });
  return result;
});
