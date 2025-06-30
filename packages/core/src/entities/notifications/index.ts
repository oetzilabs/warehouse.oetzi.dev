import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import {
  NotificationCreateSchema,
  NotificationUpdateSchema,
  TB_notifications,
  TB_organizations_notifications,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import {
  NotificationInvalidId,
  NotificationNotCreated,
  NotificationNotDeleted,
  NotificationNotFound,
  NotificationNotUpdated,
  NotificationOrganizationInvalidId,
  NotificationOrganizationLinkFailed,
} from "./errors";

export class NotificationService extends Effect.Service<NotificationService>()("@warehouse/notifications", {
  effect: Effect.gen(function* (_) {
    const database = yield* DatabaseService;
    const db = yield* database.instance;

    const create = Effect.fn("@warehouse/notifications/create")(function* (
      userInput: InferInput<typeof NotificationCreateSchema>,
      organizationId: string,
    ) {
      const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
      if (!parsedOrgId.success) {
        return yield* Effect.fail(new NotificationOrganizationInvalidId({ organizationId }));
      }

      const [notification] = yield* Effect.promise(() => db.insert(TB_notifications).values(userInput).returning());
      if (!notification) {
        return yield* Effect.fail(new NotificationNotCreated({}));
      }

      const [connectedToOrg] = yield* Effect.promise(() =>
        db
          .insert(TB_organizations_notifications)
          .values({
            organizationId: parsedOrgId.output,
            notificationId: notification.id,
          })
          .returning(),
      );

      if (!connectedToOrg) {
        return yield* Effect.fail(
          new NotificationOrganizationLinkFailed({
            organizationId: parsedOrgId.output,
            notificationId: notification.id,
          }),
        );
      }

      return notification;
    });

    const findById = Effect.fn("@warehouse/notifications/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new NotificationInvalidId({ id }));
      }

      const notification = yield* Effect.promise(() =>
        db.query.TB_notifications.findFirst({
          where: (notifications, operations) => operations.eq(notifications.id, parsedId.output),
        }),
      );

      if (!notification) {
        return yield* Effect.fail(new NotificationNotFound({ id }));
      }

      return notification;
    });

    const update = Effect.fn("@warehouse/notifications/update")(function* (
      input: InferInput<typeof NotificationUpdateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new NotificationInvalidId({ id: input.id }));
      }

      const [updated] = yield* Effect.promise(() =>
        db
          .update(TB_notifications)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(TB_notifications.id, parsedId.output))
          .returning(),
      );

      if (!updated) {
        return yield* Effect.fail(new NotificationNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/notifications/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new NotificationInvalidId({ id }));
      }

      const [deleted] = yield* Effect.promise(() =>
        db.delete(TB_notifications).where(eq(TB_notifications.id, parsedId.output)).returning(),
      );

      if (!deleted) {
        return yield* Effect.fail(new NotificationNotDeleted({ id }));
      }

      return deleted;
    });

    const safeRemove = Effect.fn("@warehouse/notifications/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new NotificationInvalidId({ id }));
      }

      const [safeRemoved] = yield* Effect.promise(() =>
        db
          .update(TB_notifications)
          .set({ deletedAt: new Date() })
          .where(eq(TB_notifications.id, parsedId.output))
          .returning(),
      );

      if (!safeRemoved) {
        return yield* Effect.fail(new NotificationNotDeleted({ id }));
      }

      return safeRemoved;
    });

    const sync = Effect.fn("@warehouse/notifications/sync")(function* () {
      const notifications = yield* Effect.promise(() =>
        db.query.TB_notifications.findMany({
          where: (fields, operations) => operations.isNull(fields.deletedAt),
          with: {
            organizations: true,
          },
        }),
      );

      const organizations = yield* Effect.promise(() =>
        db.query.TB_organizations.findMany({
          where: (fields, operations) => operations.isNull(fields.deletedAt),
        }),
      );

      yield* Effect.all(
        notifications.map((notification) =>
          Effect.promise(() =>
            db
              .insert(TB_organizations_notifications)
              .values({ organizationId: organizations[0].id, notificationId: notification.id })
              .onConflictDoNothing()
              .returning(),
          ),
        ),
        { concurrency: 10 },
      );
      return true;
    });

    const findByOrganizationId = Effect.fn("@warehouse/notifications/findByOrganizationId")(function* (
      organizationId: string,
    ) {
      const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
      if (!parsedOrgId.success) {
        return yield* Effect.fail(new NotificationOrganizationInvalidId({ organizationId }));
      }

      const notifications = yield* Effect.promise(() =>
        db.query.TB_organizations_notifications.findMany({
          where: (fields, operations) =>
            operations.and(operations.eq(fields.organizationId, parsedOrgId.output), operations.isNull(fields.readAt)),
          with: {
            notification: true,
          },
        }),
      );

      return notifications.map((n) => n.notification);
    });

    const accept = Effect.fn("@warehouse/notifications/accept")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new NotificationInvalidId({ id }));
      }

      const [updated] = yield* Effect.promise(() =>
        db
          .update(TB_organizations_notifications)
          .set({ readAt: new Date() })
          .where(eq(TB_organizations_notifications.notificationId, parsedId.output))
          .returning(),
      );

      if (!updated) {
        return yield* Effect.fail(new NotificationNotUpdated({ id }));
      }

      return updated;
    });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByOrganizationId,
      accept,
      sync,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const NotificationLive = NotificationService.Default;

// Type exports
export type NotificationInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<NotificationService["findById"]>>>>;
