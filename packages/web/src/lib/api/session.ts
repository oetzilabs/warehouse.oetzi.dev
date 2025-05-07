import { client } from "@warehouseoetzidev/core/src/auth/client";
import { subjects } from "@warehouseoetzidev/core/src/auth/subjects";
import { AuthLive, AuthService, JwtSecrets, JwtSecretsLive } from "@warehouseoetzidev/core/src/entities/auth";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Effect } from "effect";
import { getCookie } from "vinxi/http";

export const withSession = async () => {
  const sessionToken = getCookie("session_token");

  if (!sessionToken) {
    return undefined;
  }

  const verified = await Effect.runPromise(
    Effect.gen(function* (_) {
      const authService = yield* _(AuthService);
      return yield* authService.verify(sessionToken);
    }).pipe(Effect.provide(AuthLive), Effect.provideService(JwtSecrets, JwtSecretsLive)),
  );

  return [verified.user, verified.session] as const;
};
