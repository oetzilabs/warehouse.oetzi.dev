import { action, json, query, redirect } from "@solidjs/router";
import { AuthLive, AuthService, type AuthVerified } from "@warehouseoetzidev/core/src/entities/authentication";
import { Effect, Redacted, Schema } from "effect";
import { getCookie, setCookie } from "vinxi/http";
import { run, runUnAuthenticated } from "./utils";

class PasswordDoesNotMatch extends Schema.TaggedError<PasswordDoesNotMatch>()("PasswordDoesNotMatch", {
  message: Schema.optional(Schema.String),
}) {}

export const logout = action(async () => {
  "use server";
  return run(
    "@action/logout",
    Effect.gen(function* (_) {
      const sessionToken = getCookie("session_token");
      if (sessionToken) {
        setCookie("session_token", "", {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 0,
        });

        const authService = yield* AuthService;
        yield* authService.removeSession(sessionToken);
      }

      return redirect("/", {
        revalidate: [getAuthenticatedUser.key, getSessionToken.key],
      });
    }).pipe(Effect.provide(AuthLive)),
    (errors) =>
      json(errors, {
        revalidate: [getAuthenticatedUser.key, getSessionToken.key],
      }),
  );
});

type AuthedUser = AuthVerified["user"] | null;

export const getAuthenticatedUser = query(async () => {
  "use server";
  const sessionToken = getCookie("session_token");
  if (!sessionToken) {
    return null;
  }
  return runUnAuthenticated(
    "@query/get-authenticated-user",
    Effect.gen(function* (_) {
      const authService = yield* AuthService;
      const verified = yield* authService.verify(sessionToken).pipe(Effect.catchAll(() => Effect.succeed(null)));
      const result: AuthedUser = verified?.user ?? null;
      return json(result);
    }).pipe(Effect.provide(AuthLive)),
    json(null as AuthedUser),
  );
}, "user");

export const getSessionToken = query(async () => {
  "use server";
  return getCookie("session_token");
}, "sessionToken");

export const loginViaEmail = action(async (email: string, password: string) => {
  "use server";
  return runUnAuthenticated(
    "@action/login-via-email",
    Effect.gen(function* () {
      const authService = yield* AuthService;
      const { session } = yield* authService.login(email, Redacted.make(password));
      setCookie("session_token", session.access_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: session.expiresAt,
      });
      return json(true, {
        revalidate: [getAuthenticatedUser.key],
      });
    }).pipe(Effect.provide(AuthLive)),
    (errors) => json(errors),
  );
});

export const signupViaEmail = action(async (email: string, password: string, password2: string) => {
  "use server";
  return runUnAuthenticated(
    "@action/signup-via-email",
    Effect.gen(function* (_) {
      if (password !== password2) {
        return yield* Effect.fail(new PasswordDoesNotMatch({ message: "Passwords do not match" }));
      }
      const authService = yield* AuthService;
      yield* Effect.log("Signing up");
      const { session } = yield* authService.signup(email, password);
      setCookie("session_token", session.access_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: session.expiresAt,
      });
      return redirect("/", {
        revalidate: [getAuthenticatedUser.key, getSessionToken.key],
      });
    }).pipe(Effect.provide([AuthLive])),
    (errors) => json(errors),
  );
});
