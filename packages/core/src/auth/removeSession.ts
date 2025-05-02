import { Effect } from "effect";
import { SessionLive, SessionService } from "../entities/sessions";

export const removeSession = async (token: string) => {
  const removed = await Effect.runPromise(
    Effect.gen(function* (_) {
      const sessionService = yield* _(SessionService);
      const session = yield* sessionService.findByToken(token);
      if (!session) {
        return {
          err: new Error("Session not found"),
          success: false,
        } as const;
      }
      const removedSession = yield* sessionService.remove(session.id);
      return {
        success: true,
        session: removedSession,
      } as const;
    }).pipe(Effect.provide(SessionLive)),
  );
  return removed;
};
