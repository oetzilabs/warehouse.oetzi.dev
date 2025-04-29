import { action, redirect } from "@solidjs/router";
import { Organization } from "@zomoetzidev/core/src/entities/organizations";
import { User } from "@zomoetzidev/core/src/entities/users";
import { appendHeader, getCookie, getEvent } from "vinxi/http";
import { z } from "zod";
import { lucia } from "../auth";
import { withSession } from "./utils";

export const saveUser = action(async (data: FormData) => {
  "use server";
  const [, event] = await withSession();
  if (!event.context.user) {
    return new Error("Unauthorized");
  }
  const { id } = event.context.user;
  const data_ = Object.fromEntries(data.entries());
  const d = { id, ...data_ };
  const valid = User.safeParseUpdate(d);
  if (!valid.success) {
    // console.log("valid.error", valid.error);
    return new Error("Invalid data");
  }
  const updatedUser = await User.update(valid.data);
  return updatedUser;
});

export const saveUserFromOnboarding = action(async (data: { name: string; phone: string }) => {
  "use server";
  const [, event] = await withSession();
  if (!event.context.user) {
    return new Error("Unauthorized");
  }
  const { id } = event.context.user;
  const updatedUser = await User.update({
    id,
    name: data.name,
    // phone: data.phone,
  });
  return updatedUser;
});

export const disableUser = action(async () => {
  "use server";
  const [session, event] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  const { id } = event.context.user!;
  await User.markAsDeleted({
    id,
  });
  await lucia.invalidateSession(session.session.id);
  appendHeader(event, "Set-Cookie", lucia.createBlankSessionCookie().serialize());
  throw redirect("/");
});

export const setDashboard = action(async (organization_id: string) => {
  "use server";
  const [session, event] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  const validOrganization = z.string().uuid().safeParse(organization_id);
  if (!validOrganization.success) {
    throw new Error("Invalid data");
  }
  const organizationId = validOrganization.data;
  const o = await Organization.findById(organizationId);
  if (!o) {
    throw new Error("Organization not found");
  }

  await lucia.invalidateSession(session.session.id);
  const newSession = await lucia.createSession(
    session.user.id,
    {
      access_token: session.session.access_token,
      current_organization_id: o.id,
      userId: session.user.id,
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

export const setCurrentOrganization = action(async (id: string) => {
  "use server";
  const [session, event] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }
  const validOrganization = z.string().uuid().safeParse(id);
  if (!validOrganization.success) {
    throw new Error("Invalid data");
  }
  const organizationId = validOrganization.data;
  const o = await Organization.findById(organizationId);
  if (!o) {
    throw new Error("Organization not found");
  }

  await lucia.invalidateSession(session.session.id);
  const newSession = await lucia.createSession(
    session.user.id,
    {
      access_token: session.session.access_token,
      current_organization_id: o.id,
      userId: session.user.id,
      createdAt: new Date(),
    },
    {
      sessionId: session.session.id,
    }
  );
  appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.session.id).serialize());
  event.context.session = newSession;

  return o;
});
