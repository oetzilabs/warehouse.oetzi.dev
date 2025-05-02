import { action, json, query, redirect } from "@solidjs/router";
import { AuthLive, AuthService } from "@warehouseoetzidev/core/src/entities/auth";
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
      }).pipe(Effect.provide(AuthLive)),
    );
  }

  setCookie("session_token", "", {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 0,
  });

  redirect("/");
});

export const getAuthenticatedUser = query(async () => {
  "use server";
  const sessionToken = getCookie("session_token");

  if (!sessionToken) {
    console.log("No access token");
    return undefined;
  }

  const verified = await Effect.runPromise(
    Effect.gen(function* (_) {
      const authService = yield* _(AuthService);
      return yield* authService.verify(sessionToken);
    }).pipe(Effect.provide(AuthLive)),
  );

  if (!verified.success) {
    return undefined;
  }

  return verified.user;
}, "user");

export const loginViaEmail = action(async (email: string, password: string) => {
  "use server";
  const sessionToken = getCookie("session_token");

  if (sessionToken) {
    await Effect.runPromise(
      Effect.gen(function* (_) {
        const authService = yield* _(AuthService);
        return yield* authService.removeSession(sessionToken);
      }).pipe(Effect.provide(AuthLive)),
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
    }).pipe(Effect.provide(AuthLive)),
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

  return json(loginAttempt, {
    revalidate: [getAuthenticatedUser.key],
    status: 302,
    headers: {
      Location: "/",
    },
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
      }).pipe(Effect.provide(AuthLive)),
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
    }).pipe(Effect.provide(AuthLive)),
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

  return signupAttempt;
});
