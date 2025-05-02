import dayjs from "dayjs";
import { Effect } from "effect";
import { SessionLive, SessionService } from "./sessions";
import { UserLive, UserService } from "./users";

export class AuthService extends Effect.Service<AuthService>()("@warehouse/auth", {
  effect: Effect.gen(function* (_) {
    const sessionService = yield* _(SessionService);
    const userService = yield* _(UserService);

    const verify = (token: string) =>
      Effect.gen(function* (_) {
        const session = yield* sessionService.findByToken(token);
        if (!session) {
          return { err: new Error("Session not found"), success: false } as const;
        }
        if (session.expiresAt < new Date()) {
          return { err: new Error("Session expired"), success: false } as const;
        }
        const user = yield* userService.findById(session.userId);
        if (!user) {
          return { err: new Error("User not found"), success: false } as const;
        }
        return { success: true, user } as const;
      });

    const login = (email: string, password: string) =>
      Effect.gen(function* (_) {
        const attempt = yield* userService.verifyPassword(email, password);
        if (!attempt) {
          return { err: new Error("Login failed"), success: false } as const;
        }
        const user = yield* userService.findByEmail(email);
        if (!user) {
          return { err: new Error("User not found"), success: false } as const;
        }

        const token = yield* sessionService.generateToken();
        const expiresAt = dayjs().add(7, "days").toDate();
        const session = yield* sessionService.create({
          expiresAt,
          userId: user.id,
          access_token: token,
        });

        if (!session) {
          return { err: new Error("Session not found"), success: false } as const;
        }
        if (session.expiresAt < new Date()) {
          return { err: new Error("Session expired"), success: false } as const;
        }
        return { success: true, user, session } as const;
      });

    const removeSession = (token: string) =>
      Effect.gen(function* (_) {
        const session = yield* sessionService.findByToken(token);
        if (!session) {
          return { err: new Error("Session not found"), success: false } as const;
        }
        const removedSession = yield* sessionService.remove(session.id);
        return { success: true, session: removedSession } as const;
      });

    const signup = (email: string, password: string) =>
      Effect.gen(function* (_) {
        const user = yield* userService.findByEmail(email);
        if (user) {
          return { err: new Error("User already exists"), success: false } as const;
        }
        const attempt = yield* userService.create({ email, password, name: email, status: "active" });
        if (!attempt) {
          return { err: new Error("Signup failed"), success: false } as const;
        }

        const token = yield* sessionService.generateToken();
        const expiresAt = dayjs().add(7, "days").toDate();
        const session = yield* sessionService.create({
          expiresAt,
          userId: attempt.id,
          access_token: token,
        });

        if (!session) {
          return { err: new Error("Session not found"), success: false } as const;
        }
        if (session.expiresAt < new Date()) {
          return { err: new Error("Session expired"), success: false } as const;
        }
        return { success: true, user: attempt, session } as const;
      });

    return {
      verify,
      login,
      signup,
      removeSession,
    } as const;
  }),
  dependencies: [SessionLive, UserLive],
}) {}

export const AuthLive = AuthService.Default;
