import dayjs from "dayjs";
import { Effect } from "effect";
import { SessionLive, SessionService } from "../entities/sessions";
import { UserLive, UserService } from "../entities/users";

export const login = async (email: string, password: string) => {
  const userLogin = await Effect.runPromise(
    Effect.gen(function* (_) {
      const userService = yield* _(UserService);
      const attempt = yield* userService.verifyPassword(email, password);
      if (!attempt) {
        return {
          err: new Error("Login failed"),
          success: false,
        } as const;
      }
      const user = yield* userService.findByEmail(email);
      if (!user) {
        return {
          err: new Error("User not found"),
          success: false,
        } as const;
      }

      const sessionService = yield* _(SessionService);
      const token = yield* sessionService.generateToken();
      const expiresAt = dayjs().add(7, "days").toDate();
      const session = yield* sessionService.create({
        expiresAt,
        userId: user.id,
        access_token: token,
      });
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
      return {
        success: true,
        user: attempt,
        session,
      } as const;
    }).pipe(Effect.provide(SessionLive), Effect.provide(UserLive)),
  );
  return userLogin;
};
