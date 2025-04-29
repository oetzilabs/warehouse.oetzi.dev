import { lucia } from "@/lib/auth";
import { getAuthenticatedSession, getAuthenticatedUser } from "@/lib/api/auth";
import { action, redirect, reload } from "@solidjs/router";
import { Organization } from "@zomoetzidev/core/src/entities/organizations";
import { appendHeader, getCookie, getEvent } from "vinxi/http";
import { z } from "zod";

export const logout = action(async () => {
  "use server";
  const event = getEvent()!;
  if (!event.context.session) {
    return new Error("Unauthorized");
  }
  await lucia.invalidateSession(event.context.session.id);
  appendHeader(event, "Set-Cookie", lucia.createBlankSessionCookie().serialize());
  event.context.session = null;

  reload({
    headers: { Location: "/auth/login" },
    status: 303,
    revalidate: [getAuthenticatedSession.key, getAuthenticatedUser.key],
  });
});

export const revokeAllSessions = action(async () => {
  "use server";
  const event = getEvent()!;
  if (!event.context.user) {
    // console.log("Unauthorized");
    return false;
  }
  const { id } = event.context.user;
  await lucia.invalidateUserSessions(id);
  reload({
    headers: { Location: "/auth/login" },
    status: 303,
    revalidate: [getAuthenticatedSession.key, getAuthenticatedUser.key],
  });
});

export const revokeSession = action(async (session_id: string) => {
  "use server";
  // const event = getEvent()!;

  const { session, user } = await lucia.validateSession(session_id);
  if (!session || !user) {
    throw redirect("/auth/login");
  }

  await lucia.invalidateSession(session_id);

  return true;
});

export const changeNotificationSettings = action(async (type: string) => {
  "use server";
  const event = getEvent()!;
  if (!event.context.user) {
    return new Error("Unauthorized");
  }

  return { type };
});

export const changeMessageSettings = action(async (type: string) => {
  "use server";
  const event = getEvent()!;
  if (!event.context.user) {
    return new Error("Unauthorized");
  }
  return { type };
});

export const disconnectFromOrganization = action(async (data: string) => {
  "use server";
  const event = getEvent()!;
  const sessionId = getCookie(event, lucia.sessionCookieName) ?? null;

  if (!sessionId) {
    throw redirect("/auth/login");
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session || !user) {
    throw redirect("/auth/login");
  }
  const valid = z.string().uuid().safeParse(data);
  if (!valid.success) {
    throw new Error("Invalid data");
  }
  const organizationId = valid.data;
  const o = await Organization.disconnectUser(organizationId, user.id);
  await lucia.invalidateSession(sessionId);
  const new_session = await lucia.createSession(
    user.id,
    {
      access_token: session.access_token,
      current_organization_id: null,
      createdAt: new Date(),
      userId: user.id,
    },
    {
      sessionId: sessionId,
    }
  );
  appendHeader(event, "Set-Cookie", lucia.createSessionCookie(new_session.id).serialize());
  event.context.session = session;
  return o;
});

export const deleteOrganization = action(async (id: string) => {
  "use server";
  const event = getEvent()!;
  const sessionId = getCookie(event, lucia.sessionCookieName) ?? null;

  if (!sessionId) {
    throw redirect("/auth/login");
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session || !user) {
    throw redirect("/auth/login");
  }
  const valid = z.string().uuid().safeParse(id);
  if (!valid.success) {
    throw new Error("Invalid data");
  }
  const organizationId = valid.data;
  const o = await Organization.softDelete({ id: organizationId });
  await lucia.invalidateSession(sessionId);
  const new_session = await lucia.createSession(
    user.id,
    {
      access_token: session.access_token,
      current_organization_id: null,
      createdAt: new Date(),
      userId: user.id,
    },
    {
      sessionId: sessionId,
    }
  );
  appendHeader(event, "Set-Cookie", lucia.createSessionCookie(new_session.id).serialize());
  event.context.session = session;

  return o;
});

export const setOrganizationOwner = action(async (id: string) => {
  "use server";
  const event = getEvent()!;
  if (!event.context.user) {
    return new Error("Unauthorized");
  }
  const valid = z.string().uuid().safeParse(id);
  if (!valid.success) {
    return new Error("Invalid data");
  }
  const organizationId = valid.data;
  const o = await Organization.setOwner(organizationId, event.context.user.id);

  return o;
});
