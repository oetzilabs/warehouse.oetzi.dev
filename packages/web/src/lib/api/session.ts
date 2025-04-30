import { client } from "@warehouseoetzidev/core/src/auth/client";
import { subjects } from "@warehouseoetzidev/core/src/auth/subjects";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Effect } from "effect";
import { getCookie } from "vinxi/http";

export const withSession = async () => {
  const accessToken = getCookie("access_token");
  const refreshToken = getCookie("access_token");

  if (!accessToken) {
    return undefined;
  }

  const verified = await client("solidstart").verify(subjects, accessToken, {
    refresh: refreshToken,
  });

  if (verified.err) {
    return undefined;
  }

  const user = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(UserService);
      const user = yield* service.findById(verified.subject.properties.id);
      return user;
    }).pipe(Effect.provide(UserLive)),
  );
  return user;
};
