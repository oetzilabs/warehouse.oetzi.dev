import { eq, inArray, or } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { MessageCreateSchema, MessageUpdateSchema, TB_messages } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import {
  MessageInvalidId,
  MessageNotCreated,
  MessageNotDeleted,
  MessageNotFound,
  MessageNotUpdated,
  MessageUserInvalidId,
} from "./errors";

export class MessageService extends Effect.Service<MessageService>()("@warehouse/messages", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_messages.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        owner: {
          columns: {
            hashed_password: false,
          },
        },
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (userInput: InferInput<typeof MessageCreateSchema>) =>
      Effect.gen(function* (_) {
        const [message] = yield* Effect.promise(() => db.insert(TB_messages).values(userInput).returning());
        if (!message) {
          return yield* Effect.fail(new MessageNotCreated({}));
        }
        return message;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new MessageInvalidId({ id }));
        }

        const message = yield* Effect.promise(() =>
          db.query.TB_messages.findFirst({
            where: (messages, operations) => operations.eq(messages.id, parsedId.output),
            with: {
              owner: {
                columns: {
                  hashed_password: false,
                },
              },
            },
          }),
        );

        if (!message) {
          return yield* Effect.fail(new MessageNotFound({ id }));
        }

        return message;
      });

    const update = (input: InferInput<typeof MessageUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new MessageInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_messages)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_messages.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new MessageNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new MessageInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_messages).where(eq(TB_messages.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new MessageNotDeleted({ id }));
        }

        return deleted;
      });

    const findByUserEmail = (userEmail: string) =>
      Effect.gen(function* (_) {
        const messages = yield* Effect.promise(() =>
          db.query.TB_messages.findMany({
            where: (messages, operations) =>
              operations.or(operations.eq(messages.recipient, userEmail), operations.eq(messages.sender, userEmail)),
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
          }),
        );

        return messages;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new MessageInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.update(TB_messages).set({ deletedAt: new Date() }).where(eq(TB_messages.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new MessageNotCreated({ message: "Failed to safe remove message" }));
        }

        return deleted;
      });

    const findByOrganizationId = (organizationId: string, cursor?: number, pagesize = 20) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new MessageInvalidId({ id: organizationId }));
        }

        const users = yield* Effect.promise(() =>
          db.query.TB_organization_users.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              user: {
                columns: {
                  hashed_password: false,
                },
              },
            },
          }),
        );

        const emails = users.map((user) => user.user.email);

        const messages = yield* Effect.promise(() =>
          db.query.TB_messages.findMany({
            where: (messages, operations) =>
              operations.or(
                operations.inArray(messages.recipient, emails),
                operations.inArray(messages.sender, emails),
              ),
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            offset: cursor ? (cursor - 1) * pagesize : 0,
            limit: pagesize + 1,
          }),
        );

        const amountOfMessages = yield* Effect.promise(() =>
          db.$count(TB_messages, or(inArray(TB_messages.sender, emails), inArray(TB_messages.recipient, emails))),
        );

        return { messages, hasNextPage: messages.length > pagesize, pages: Math.ceil(amountOfMessages / pagesize) + 1 };
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByUserEmail,
      findByOrganizationId,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const MessageLive = MessageService.Default;

// Type exports
export type MessageInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<MessageService["findById"]>>>>;
