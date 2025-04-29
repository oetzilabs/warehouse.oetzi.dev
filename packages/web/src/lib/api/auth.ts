import { lucia } from "@/lib/auth";
import { action, cache, redirect, reload } from "@solidjs/router";
import { Organization } from "@zomoetzidev/core/src/entities/organizations";
import { appendHeader } from "vinxi/http";
import { z } from "zod";
import { withSession } from "./utils";
import { User } from "@zomoetzidev/core/src/entities/users";

export const logout = action(async () => {
  "use server";
  const [session, event] = await withSession();
  if (!session) {
    return;
  }
  await lucia.invalidateSession(session.session.id);
  appendHeader(event, "Set-Cookie", lucia.createBlankSessionCookie().serialize());
  event.context.session = null;
  event.context.user = null;
  reload({
    headers: { Location: "/auth/login" },
    status: 303,
    revalidate: [getAuthenticatedSession.key, getAuthenticatedUser.key],
  });
});

export const revokeAllSessions = action(async () => {
  "use server";
  const [_, event] = await withSession();
  const { id } = event.context.user!;
  await lucia.invalidateUserSessions(id);
  reload({
    headers: { Location: "/auth/login" },
    status: 303,
    revalidate: [getAuthenticatedSession.key, getAuthenticatedUser.key],
  });
});

export const revokeSession = action(async (session_id: string) => {
  "use server";
  const _ = await withSession();
  await lucia.invalidateSession(session_id);
  reload({
    headers: { Location: "/auth/login" },
    status: 303,
    revalidate: [getAuthenticatedSession.key, getAuthenticatedUser.key],
  });
});

export const changeNotificationSettings = action(async (type: string) => {
  "use server";
  const _ = await withSession();
  return { type };
});

export const changeMessageSettings = action(async (type: string) => {
  "use server";
  const _ = await withSession();
  return { type };
});

export const disconnectFromOrganization = action(async (data: string) => {
  "use server";
  const [session, event] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  const valid = z.string().uuid().safeParse(data);
  if (!valid.success) {
    throw new Error("Invalid data");
  }
  const organizationId = valid.data;
  const o = await Organization.disconnectUser(organizationId, session.user.id);
  await lucia.invalidateSession(session.session.id);
  const newSession = await lucia.createSession(
    session.user.id,
    {
      access_token: session.session.access_token,
      userId: session.user.id,
      current_organization_id: null,
      createdAt: new Date(),
    },
    {
      sessionId: session.session.id,
    }
  );
  appendHeader(event, "Set-Cookie", lucia.createSessionCookie(newSession.id).serialize());
  event.context.session = newSession;
  return o;
});

export const deleteOrganization = action(async (id: string) => {
  "use server";
  const [session, event] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  const valid = z.string().uuid().safeParse(id);
  if (!valid.success) {
    throw new Error("Invalid data");
  }
  const organizationId = valid.data;
  const o = await Organization.softDelete({ id: organizationId });
  await lucia.invalidateSession(session.session.id);
  const new_session = await lucia.createSession(
    session.user.id,
    {
      access_token: session.session.access_token,
      userId: session.user.id,
      current_organization_id: null,
      createdAt: new Date(),
    },
    {
      sessionId: session.session.id,
    }
  );
  appendHeader(event, "Set-Cookie", lucia.createSessionCookie(new_session.id).serialize());
  event.context.session = new_session;

  return o;
});

export const setOrganizationOwner = action(async (id: string) => {
  "use server";
  const [_, event] = await withSession();
  const valid = z.string().uuid().safeParse(id);
  if (!valid.success) {
    return new Error("Invalid data");
  }
  const organizationId = valid.data;
  const o = await Organization.setOwner(organizationId, event.context.user!.id);

  return o;
});

export const getAuthenticatedUser = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return null;
  }
  const { user } = await lucia.validateSession(session.session.id);
  return user;
}, "user");

export type UserSession = {
  id: string | null;
  token: string | null;
  expiresAt: Date | null;
  user: Awaited<ReturnType<typeof User.findById>> | null;
  organizations: Awaited<NonNullable<ReturnType<typeof Organization.findManyById>>>;
  current_organization: Awaited<ReturnType<typeof Organization.findById>> | null;
  createdAt: Date | null;
};

export const getAuthenticatedSession = cache(async () => {
  "use server";
  let userSession = {
    id: null,
    token: null,
    expiresAt: null,
    user: null,
    organizations: [],
    current_organization: null,
    createdAt: null,
  } as UserSession;
  const [session] = await withSession();
  if (!session) {
    return userSession;
  }
  if (!session.session) {
    return userSession;
  }

  userSession.id = session.session.id;
  userSession.organizations = await Organization.findManyByUserId(session.session.userId);
  if (session.session.current_organization_id)
    userSession.current_organization = await Organization.findById(session.session.current_organization_id);
  if (session.session.userId) userSession.user = await User.findById(session.session.userId);
  if (session.session.createdAt) userSession.createdAt = session.session.createdAt;

  return userSession;
}, "session");

export const getAuthenticatedSessions = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  const sessions = await lucia.getUserSessions(session.user.id);
  return sessions;
}, "sessions");

export const getCurrentOrganization = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const org = Organization.findById(session.session.current_organization_id);

  if (!org) {
    throw redirect("/setup/organization");
  }

  return org;
}, "current-organization");

export const getCurrentOrganizationSlug = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  const orgs = await Organization.findManyByUserId(session.user.id);

  if (!session.session.current_organization_id) {
    if (orgs.length > 0) {
      throw redirect("/organization/" + orgs[0].slug);
    } else {
      throw redirect("/setup/organization");
    }
  }

  const org = await Organization.findById(session.session.current_organization_id);

  if (!org) {
    throw redirect("/404", 404);
  }

  return org.slug;
}, "current-organization-slug");
