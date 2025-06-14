import { action, json, query, redirect } from "@solidjs/router";
import { AuthLive, AuthService } from "@warehouseoetzidev/core/src/entities/authentication";
import { Cause, Chunk, Effect, Exit } from "effect";
import { status } from "effect/Fiber";
import { getCookie, setCookie } from "vinxi/http";

export const logout = action(async () => {
  "use server";
  const sessionToken = getCookie("session_token");

  if (sessionToken) {
    // TODO: Remove session from cookie
    setCookie("session_token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });

    // TODO: Remove session from database
    await Effect.runPromise(
      Effect.gen(function* (_) {
        const authService = yield* _(AuthService);
        return yield* authService.removeSession(sessionToken);
      }).pipe(Effect.provide(AuthLive)),
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
    try {
      const verified = await Effect.runPromise(
        Effect.gen(function* (_) {
          const authService = yield* _(AuthService);
          return yield* authService.verify(sessionToken);
        }).pipe(Effect.provide(AuthLive)),
      );
      if (!verified) {
        return redirect("/", {
          status: 303,
          headers: {
            "Set-Cookie": "session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0",
          },
        });
      }

      if (!options.skipOnboarding && !verified.user.has_finished_onboarding) {
        return redirect("/onboarding");
      }

      return verified.user;
    } catch (e) {
      return undefined;
    }
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
      }).pipe(Effect.provide(AuthLive)),
    );

    setCookie("session_token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });
  }

  const loginAttempt = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const authService = yield* _(AuthService);
      return yield* authService.login(email, password);
    }).pipe(Effect.provide(AuthLive)),
  );

  return Exit.match(loginAttempt, {
    onSuccess: ({ user, session }) => {
      setCookie("session_token", session.access_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: session.expiresAt,
      });
      return redirect("/", {
        revalidate: [getAuthenticatedUser.key],
      });
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      console.log(errors);
      throw new Error(`Some error(s) occurred at 'loginViaEmail': ${errors.join(", ")}`);
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

  const signupAttempt = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const authService = yield* _(AuthService);
      return yield* authService.signup(email, password);
    }).pipe(Effect.provide(AuthLive)),
  );

  return Exit.match(signupAttempt, {
    onSuccess: ({ user, session }) => {
      setCookie("session_token", session.access_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: session.expiresAt,
      });
      return redirect("/", {
        revalidate: [getAuthenticatedUser.key],
      });
    },
    onFailure: (cause) => {
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
});
