import { action, json, query, redirect } from "@solidjs/router";
import { AuthLive, AuthService, JwtSecrets, JwtSecretsLive } from "@warehouseoetzidev/core/src/entities/auth";
import { Effect } from "effect";
import { status } from "effect/Fiber";
import { getCookie, setCookie } from "vinxi/http";

export const logout = action(async () => {
  "use server";
  const sessionToken = getCookie("session_token");

  if (sessionToken) {
    await Effect.runPromise(
      Effect.gen(function* (_) {
        const authService = yield* _(AuthService);
        return yield* authService.removeSession(sessionToken);
      }).pipe(Effect.provide(AuthLive), Effect.provideService(JwtSecrets, JwtSecretsLive)),
    );
  }

  return redirect("/", {
    revalidate: [getAuthenticatedUser.key],
  });
});

export const getAuthenticatedUser = query(
  async (
    options: { skipOnboarding?: boolean } = {
      skipOnboarding: false,
    },
  ) => {
    "use server";
    const sessionToken = getCookie("session_token");

    if (!sessionToken) {
      return undefined;
    }

    const verified = await Effect.runPromise(
      Effect.gen(function* (_) {
        const authService = yield* _(AuthService);
        return yield* authService.verify(sessionToken);
      }).pipe(Effect.provide(AuthLive), Effect.provideService(JwtSecrets, JwtSecretsLive)),
    ).catch((e) => ({ err: e, success: false }) as const);

    if (!verified.success) {
      // Remove the session token from the cookie and redirect to home page
      return redirect("/", {
        status: 302,
        headers: {
          "Set-Cookie": "session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0",
        },
      });
    }

    if (!options.skipOnboarding && !verified.user.has_finished_onboarding) {
      return redirect("/onboarding");
    }

    return verified.user;
  },
  "user",
);

export const getSessionToken = query(async () => {
  "use server";
  return getCookie("session_token");
}, "sessionToken");

export const loginViaEmail = action(async (email: string, password: string) => {
  "use server";
  const sessionToken = getCookie("session_token");

  if (sessionToken) {
    await Effect.runPromise(
      Effect.gen(function* (_) {
        const authService = yield* _(AuthService);
        return yield* authService.removeSession(sessionToken);
      }).pipe(Effect.provide(AuthLive), Effect.provideService(JwtSecrets, JwtSecretsLive)),
    );

    setCookie("session_token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });
  }

  const loginAttempt = await Effect.runPromise(
    Effect.gen(function* (_) {
      const authService = yield* _(AuthService);
      return yield* authService.login(email, password);
    }).pipe(Effect.provide(AuthLive), Effect.provideService(JwtSecrets, JwtSecretsLive)),
  );

  if (!loginAttempt.success) {
    throw loginAttempt.err;
  }

  setCookie("session_token", loginAttempt.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: loginAttempt.session.expiresAt,
  });

  return redirect("/", {
    revalidate: [getAuthenticatedUser.key],
  });
});

export const signupViaEmail = action(async (email: string, password: string, password2: string) => {
  "use server";
  if (password !== password2) {
    throw new Error("Passwords do not match");
  }
  const sessionToken = getCookie("session_token");

  if (sessionToken) {
    await Effect.runPromise(
      Effect.gen(function* (_) {
        const authService = yield* _(AuthService);
        return yield* authService.removeSession(sessionToken);
      }).pipe(Effect.provide(AuthLive), Effect.provideService(JwtSecrets, JwtSecretsLive)),
    );

    setCookie("session_token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });
  }

  const signupAttempt = await Effect.runPromise(
    Effect.gen(function* (_) {
      const authService = yield* _(AuthService);
      return yield* authService.signup(email, password);
    }).pipe(Effect.provide(AuthLive), Effect.provideService(JwtSecrets, JwtSecretsLive)),
  );

  if (!signupAttempt.success) {
    throw signupAttempt.err;
  }

  setCookie("session_token", signupAttempt.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: signupAttempt.session.expiresAt,
  });

  return redirect("/", {
    revalidate: [getAuthenticatedUser.key],
  });
});
