import { lucia } from "@/lib/auth";
import type { APIEvent } from "@solidjs/start/server";
import { UserService } from "@zomoetzidev/core/src/entities/users";
import { appendHeader, sendRedirect } from "vinxi/http";

export async function GET(e: APIEvent) {
  const event = e.nativeEvent;
  const url = new URL(e.request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return sendRedirect(event, "/auth/error?error=missing_code", 303);
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: "google",
    code,
    redirect_uri: import.meta.env.VITE_LOGIN_REDIRECT,
  });

  const response = await fetch(`${import.meta.env.VITE_AUTH_URL}token?type=main`, {
    method: "POST",
    body,
  }).then(async (r) => r.json());

  console.log("response", response);

  if (!response.access_token) {
    return sendRedirect(event, "/auth/error?error=missing_access_token", 303);
  }

  const sessionResponse = await fetch(`${import.meta.env.VITE_API_URL}/session`, {
    headers: {
      Authorization: `Bearer ${response.access_token}`,
      authorization: `Bearer ${response.access_token}`,
    },
  }).then((r) => r.json());

  const { user_id, organization_id } = sessionResponse;

  if (!user_id) {
    return sendRedirect(event, "/auth/error?error=missing_user", 303);
  }

  const session = await lucia.createSession(user_id, {
    access_token: response.access_token,
    current_organization_id: organization_id ?? null,
    createdAt: new Date(),
    userId: user_id,
  });

  appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());

  event.context.session = session;

  // TODO: get user from UserService
  // const user = await

  // if (user && user.verifiedAt) return sendRedirect(event, "/", 303);
  return sendRedirect(event, "/auth/verify-email", 303);
}
