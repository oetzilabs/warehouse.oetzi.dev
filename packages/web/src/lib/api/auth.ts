import { action, query, redirect } from "@solidjs/router";
import { AuthLive, AuthService } from "@warehouseoetzidev/core/src/entities/authentication";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
import { Cause, Chunk, Effect, Exit } from "effect";
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
    revalidate: [getAuthenticatedUser.key, getSessionToken.key],
  });
});

export const getAuthenticatedUser = query(async () => {
  "use server";
  const sessionToken = getCookie("session_token");

  if (!sessionToken) {
    return undefined;
  }
  const verifiedExit = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const authService = yield* AuthService;
      return yield* authService.verify(sessionToken);
    }).pipe(Effect.provide(AuthLive)),
  );
  return Exit.match(verifiedExit, {
    onSuccess: (verified) => verified.user,
    onFailure: (cause) => {
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return { name: c._tag ?? "unknown", message: c.message ?? "unknown" };
      });
      console.log(errors);
      return undefined;
    },
  });
}, "user");

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
        const authService = yield* AuthService;
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
      const authService = yield* AuthService;
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
      throw redirect(`/error?message=${encodeURI(errors.join(", "))}&function=loginViaEmail`, {
        status: 500,
        statusText: `Internal Server Error: ${errors.join(", ")}`,
      });
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
        const authService = yield* AuthService;
        yield* Effect.log("Removing session");
        return yield* authService.removeSession(sessionToken);
      }).pipe(Effect.provide([AuthLive, createOtelLayer("@action/signup-via-email/remove-session")])),
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
      const authService = yield* AuthService;
      yield* Effect.log("Signing up");
      return yield* authService.signup(email, password);
    }).pipe(Effect.provide([AuthLive, createOtelLayer("@action/signup-via-email/signup-attempt")])),
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
        revalidate: [getAuthenticatedUser.key, getSessionToken.key],
      });
    },
    onFailure: (cause) => {
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return `[${c._tag ?? "unknown"}] ${c.message}`;
      });
      console.log(errors);
      throw redirect(`/error?message=${encodeURI(errors.join(", "))}&function=signupViaEmail`, {
        status: 500,
        statusText: `Internal Server Error: ${errors.join(", ")}`,
      });
    },
  });
});
