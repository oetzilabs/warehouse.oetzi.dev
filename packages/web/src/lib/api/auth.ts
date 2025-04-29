import { query, redirect } from "@solidjs/router";
import { client } from "@warehouseoetzidev/core/src/auth/client";
import { subjects } from "@warehouseoetzidev/core/src/auth/subjects";
import { Resource } from "sst";
import { getCookie, setCookie } from "vinxi/http";

export async function logout() {
  const cookieNames = ["access_token", "refresh_token"];
  for (const name of cookieNames) {
    await setCookie(name, "", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 0,
    });
  }

  redirect("/");
}

export const getAuthenticatedUser = query(async () => {
  "use server";

  const accessToken = await getCookie("access_token");
  const refreshToken = await getCookie("access_token");

  if (!accessToken) {
    return false;
  }

  const verified = await client.verify(subjects, accessToken, {
    refresh: refreshToken,
  });

  if (verified.err) {
    return false;
  }
  if (verified.tokens) {
    // await setTokens(verified.tokens.access, verified.tokens.refresh);
    await setCookie("access_token", verified.tokens.access, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 34560000,
    });
    await setCookie("refresh_token", verified.tokens.refresh, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 34560000,
    });
  }

  return verified.subject;
}, "user");
