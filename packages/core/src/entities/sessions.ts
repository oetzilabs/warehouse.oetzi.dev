import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import { SessionCreateSchema, SessionUpdateSchema, TB_sessions } from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";

export class SessionService extends Effect.Service<SessionService>()("@warehouse/sessions", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_sessions.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        user: true,
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (sessionInput: InferInput<typeof SessionCreateSchema>) =>
      Effect.gen(function* (_) {
        const [session] = yield* Effect.promise(() => db.insert(TB_sessions).values(sessionInput).returning());

        return session;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid session ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_sessions.findFirst({
            where: (sessions, operations) => operations.eq(sessions.id, parsedId.output),
            with: relations,
          }),
        );
      });

    const generateToken = () =>
      Effect.gen(function* (_) {
        const token = randomBytes(32).toString("hex");
        return token;
      });

    const findByUserId = (userId: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, userId);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_sessions.findMany({
            where: (sessions, operations) => operations.eq(sessions.userId, parsedId.output),
            with: relations,
          }),
        );
      });

    const findByToken = (token: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_sessions.findFirst({
            where: (sessions, operations) => operations.eq(sessions.access_token, token),
            with: relations,
          }),
        );
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid session ID format"));
        }

        const [deletedSession] = yield* Effect.promise(() =>
          db.delete(TB_sessions).where(eq(TB_sessions.id, parsedId.output)).returning(),
        );

        return deletedSession;
      });

    const removeByUserId = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, userId);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }

        return yield* Effect.promise(() =>
          db.delete(TB_sessions).where(eq(TB_sessions.userId, parsedId.output)).returning(),
        );
      });

    const update = (input: InferInput<typeof SessionUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid session ID"));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_sessions)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_sessions.id, parsedId.output))
            .returning(),
        );
        return updated;
      });

    return {
      create,
      findById,
      findByUserId,
      findByToken,
      remove,
      removeByUserId,
      generateToken,
      update,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const SessionLive = SessionService.Default;
export type SessionInfo = Effect.Effect.Success<ReturnType<SessionService["findById"]>>;
