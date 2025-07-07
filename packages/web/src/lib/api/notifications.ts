import { action, json, query } from "@solidjs/router";
import {
  GetNotificationsOptions,
  NotificationLive,
  NotificationService,
  type OrganizationNotificationInfo,
} from "@warehouseoetzidev/core/src/entities/notifications";
import { Effect } from "effect";
import { run, runWithSession } from "./utils";

export const acceptNotification = action((nid: string) => {
  "use server";
  return runWithSession(
    "@action/accept-notification",
    Effect.fn(
      function* (session) {
        const service = yield* NotificationService;
        const accepted = yield* service.accept(nid, session.user_id);
        return json(accepted, {
          revalidate: [getNotifications.key],
        });
      },
      (effect) => effect.pipe(Effect.provide(NotificationLive)),
    ),
    (errors) =>
      json(errors, {
        revalidate: [getNotifications.key],
      }),
  );
});

export const syncNotifications = action(() => {
  "use server";
  return run(
    "@action/sync-notifications",
    Effect.gen(function* (_) {
      const service = yield* NotificationService;
      const synced = yield* service.sync();
      return json(synced, {
        revalidate: [getNotifications.key],
      });
    }).pipe(Effect.provide(NotificationLive)),
    (errors) =>
      json(errors, {
        revalidate: [getNotifications.key],
      }),
  );
});

export const markNotificationUnread = action((nid: string) => {
  "use server";
  return runWithSession(
    "@action/mark-notification-unread",
    Effect.fn(
      function* (session) {
        const service = yield* NotificationService;
        const accepted = yield* service.markUnread(nid, session.user_id);
        return json(accepted, {
          revalidate: [getNotifications.key],
        });
      },
      (effect) => effect.pipe(Effect.provide(NotificationLive)),
    ),
    (errors) =>
      json(errors, {
        revalidate: [getNotifications.key],
      }),
  );
});

export const getNotifications = query((options: GetNotificationsOptions = { ignoreRead: false }) => {
  "use server";
  return run(
    "@query/notifications",
    Effect.gen(function* (_) {
      const service = yield* NotificationService;
      const notifications = yield* service.findByOrganizationId(options);
      return json(notifications);
    }).pipe(Effect.provide(NotificationLive)),
    json([] as OrganizationNotificationInfo[]),
  );
}, "notifications");
