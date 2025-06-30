import { action, json, query } from "@solidjs/router";
import { NotificationLive, NotificationService } from "@warehouseoetzidev/core/src/entities/notifications";
import { Effect } from "effect";
import { run } from "./utils";

export const acceptNotification = action((nid: string) => {
  "use server";
  return run(
    "@action/accept-notification",
    Effect.gen(function* (_) {
      const service = yield* _(NotificationService);
      const accepted = yield* service.accept(nid);
      return json(accepted, {
        revalidate: [getNotifications.key],
      });
    }).pipe(Effect.provide(NotificationLive)),
    json(undefined),
  );
});

export const getNotifications = query(() => {
  "use server";
  return run(
    "@query/notifications",
    Effect.gen(function* (_) {
      const service = yield* NotificationService;
      return yield* service.findByOrganizationId();
    }).pipe(Effect.provide(NotificationLive)),
    json([]),
  );
}, "notifications");
