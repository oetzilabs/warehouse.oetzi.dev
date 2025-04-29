import { cache, redirect } from "@solidjs/router";
import { Notifications } from "@warehouseoetzidev/core/src/entities/notifications";
import { getEvent } from "vinxi/http";
import { lucia } from "../auth";
import { withSession } from "./utils";

export const getNotificationSettings = cache(async () => {
  "use server";
  const event = getEvent()!;
  if (!event.context.user) {
    throw redirect("/auth/login");
  }
  // const user = event.context.user;
  return {
    type: "everything",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  // const n = await Notifications.findManyByUserId(user.id);
  // return n;
}, "notification-settings");

export const getNotifications = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const orgNotifications = await Notifications.findByOrganizationId(session.session.current_organization_id);

  return orgNotifications;
  // const n = await Notifications.findManyByUserId(user.id);
  // return n;
}, "notifications");

export const getNotificationsCount = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  // const user = event.context.user;

  const orgNotificationsCount = await Notifications.countByOrganizationId(session.session.current_organization_id);

  return orgNotificationsCount;
}, "notifications-count");
