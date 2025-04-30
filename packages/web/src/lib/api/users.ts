import { action } from "@solidjs/router";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Effect } from "effect";

export const disable = action(async (id: string) => {
  "use server";
  const disabledUser = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(UserService);
      return yield* service.disable(id);
    }).pipe(Effect.provide(UserLive)),
  );
  return disabledUser;
});
