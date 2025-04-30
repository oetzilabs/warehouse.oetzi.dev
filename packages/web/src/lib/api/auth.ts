import { action, query, redirect } from "@solidjs/router";
import { client } from "@warehouseoetzidev/core/src/auth/client";
import { subjects } from "@warehouseoetzidev/core/src/auth/subjects";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Effect } from "effect";
import { getCookie, getHeader, setCookie } from "vinxi/http";

export const logout = action(async () => {
  "use server";
  const cookieNames = ["access_token", "refresh_token"];
  for (const name of cookieNames) {
    setCookie(name, "", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 0,
    });
  }

  redirect("/");
});

export const login = action(async () => {
  "use server";
  const c = client("solidstart");
  const accessToken = getCookie("access_token");
  const refreshToken = getCookie("refresh_token");

  if (accessToken) {
    const verified = await c.verify(subjects, accessToken, {
      refresh: refreshToken,
    });
    if (!verified.err && verified.tokens) {
      // await setTokens(verified.tokens.access, verified.tokens.refresh);
      setCookie("access_token", verified.tokens.access, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 34560000,
      });
      setCookie("refresh_token", verified.tokens.refresh, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 34560000,
      });
      return redirect("/");
    }
  }

  const host = getHeader("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const { url } = await c.authorize(`${protocol}://${host}/api/callback`, "code");
  return redirect(url);
});

export const getAuthenticatedUser = query(async () => {
  "use server";

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

  if (verified.tokens) {
    // await setTokens(verified.tokens.access, verified.tokens.refresh);
    setCookie("access_token", verified.tokens.access, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 34560000,
    });
    setCookie("refresh_token", verified.tokens.refresh, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 34560000,
    });
  }
  const user = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(UserService);
      const user = yield* service.findById(verified.subject.properties.id);
      return user;
    }).pipe(Effect.provide(UserLive)),
  );
  return user;
}, "user");
