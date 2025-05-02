import { Effect } from "effect";
import { SessionLive, SessionService } from "../entities/sessions";
import { UserLive, UserService } from "../entities/users";

export const verify = async (token: string) => {
  const verified = await Effect.runPromise(
    Effect.gen(function* (_) {
      const sessionService = yield* _(SessionService);
      const session = yield* sessionService.findByToken(token);
      if (!session) {
        return {
          err: new Error("Session not found"),
          success: false,
        } as const;
      }
      if (session.expiresAt < new Date()) {
        return {
          err: new Error("Session expired"),
          success: false,
        } as const;
      }
      const userService = yield* _(UserService);
      const user = yield* userService.findById(session.userId);
      if (!user) {
        return {
          err: new Error("User not found"),
          success: false,
        } as const;
      }
      return {
        success: true,
        user,
      } as const;
    }).pipe(Effect.provide(SessionLive), Effect.provide(UserLive)),
  );
  return verified;
};
