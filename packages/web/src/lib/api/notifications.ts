import { action, json, query, redirect } from "@solidjs/router";
import { NotificationLive, NotificationService } from "@warehouseoetzidev/core/src/entities/notifications";
import { Effect } from "effect";
import { getAuthenticatedUser } from "./auth";
import { getDashboardData } from "./dashboard";
import { withSession } from "./session";

export const acceptNotification = action(async (nid: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!session.current_organization_id) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const notification = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(NotificationService);
      return yield* service.accept(nid);
    }).pipe(Effect.provide(NotificationLive)),
  );
  return json(notification, {
    revalidate: [getNotifications.key],
  });
});

export const getNotifications = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const notifications = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(NotificationService);
      return yield* service.findByOrganizationId(orgId);
    }).pipe(Effect.provide(NotificationLive)),
  );
  return notifications;
}, "notifications-by-organization");
