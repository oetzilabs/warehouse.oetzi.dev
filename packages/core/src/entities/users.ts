import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService, db } from "../drizzle/sql";
import { TB_users, UserCreateSchema, UserUpdateSchema } from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";

export class UserService extends Effect.Service<UserService>()("@warehouse/users", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    const create = (userInput: InferInput<typeof UserCreateSchema>) =>
      Effect.gen(function* (_) {
        const [x] = yield* Effect.promise(() => db.insert(TB_users).values(userInput).returning());

        const user = yield* findById(x.id);
        if (!user) {
          return yield* Effect.fail(new Error("Failed to create user"));
        }

        return user;
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (users, operations) => operations.eq(users.id, parsedId.output),
            with: {
              // ...existing with clauses...
            },
          }),
        );
      });

    const update = (id: string, userInput: InferInput<typeof UserUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        const [updatedUser] = yield* Effect.promise(() =>
          db
            .update(TB_users)
            .set({ ...userInput, updatedAt: new Date() })
            .where(eq(TB_users.id, parsedId.output))
            .returning(),
        );
        return updatedUser;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        const [deletedUser] = yield* Effect.promise(() =>
          db.delete(TB_users).where(eq(TB_users.id, parsedId.output)).returning(),
        );
        return deletedUser;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        const [deletedUser] = yield* Effect.promise(() =>
          db.update(TB_users).set({ deletedAt: new Date() }).where(eq(TB_users.id, parsedId.output)).returning(),
        );
        return deletedUser;
      });

    const notify = (message: string) =>
      Effect.gen(function* (_) {
        return message;
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      notify,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const UserLive = UserService.Default;
export type Frontend = NonNullable<Awaited<ReturnType<UserService["findById"]>>>;
