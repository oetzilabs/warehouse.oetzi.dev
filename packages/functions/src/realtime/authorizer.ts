import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { RealtimeLive, RealtimeService } from "@warehouseoetzidev/core/src/entities/realtime";
import { Cause, Chunk, Effect, Exit } from "effect";
import { Resource } from "sst";
import { realtime } from "sst/aws/realtime";

export const handler = realtime.authorizer(async (token) => {
  console.log("Token", token);
  const tokens = token.split(":");
  const org_id = tokens[0];
  console.log("Organization ID", org_id);

  if (!org_id) {
    return {
      subscribe: [],
      publish: [],
    };
  }

  const prefix = `${Resource.App.name}/${Resource.App.stage}/` as const;

  const program = Effect.gen(function* (_) {
    const realtime = yield* _(RealtimeService);
    if (org_id === "local") {
      return yield* realtime.createTopics(prefix, org_id);
    }
    const orgService = yield* _(OrganizationService);
    const org = yield* orgService.findById(org_id);
    return yield* realtime.createTopics(prefix, org.id);
  }).pipe(Effect.provide(RealtimeLive), Effect.provide(OrganizationLive));

  const exit = await Effect.runPromiseExit(program);
  return Exit.match(exit, {
    onSuccess: (data) => data,
    onFailure: (cause) => {
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return `${c._tag}: ${c.message}`;
      });
      const messages = errors.join(", ");
      console.error("Realtime failed:", messages);
      return {
        subscribe: [],
        publish: [],
      };
    },
  });
});
