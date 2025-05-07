import dayjs from "dayjs";
import { Context, Effect } from "effect";
import jwt from "jsonwebtoken";
import ms from "ms";
import { Resource } from "sst";
import { SessionLive, SessionService } from "./sessions";
import { UserLive, UserService } from "./users";

export class JwtSecrets extends Context.Tag("JwtSecrets")<JwtSecrets, { readonly secrets: ReadonlyArray<string> }>() {}

export const JwtSecretsLive = JwtSecrets.of({
  secrets: [Resource.JWTSecret1.value, Resource.JWTSecret2.value].filter(Boolean),
});

interface JwtPayload {
  userId: string;
}

export class AuthService extends Effect.Service<AuthService>()("@warehouse/auth", {
  effect: Effect.gen(function* (_) {
    const sessionService = yield* _(SessionService);
    const userService = yield* _(UserService);
    const { secrets: jwtSecrets } = yield* _(JwtSecrets); // Access the JWT secrets

    if (jwtSecrets.length === 0) {
      // Handle the critical error if no secrets are loaded
      yield* Effect.die(new Error("JWT secrets are not configured. Cannot start Auth Service."));
      // Or return an Effect.fail with a specific error
    }

    // Function to generate a JWT
    const generateJwt = (userId: string, expiresIn: number): Effect.Effect<string, Error> =>
      Effect.gen(function* (_) {
        const payload: JwtPayload = { userId };
        return jwt.sign(payload, jwtSecrets[0], { expiresIn });
      });

    // Function to verify a JWT
    const verifyJwt = (token: string): Effect.Effect<JwtPayload, Error> =>
      Effect.gen(function* (_) {
        for (const secret of jwtSecrets) {
          try {
            const decoded = jwt.verify(token, secret) as JwtPayload;
            return decoded; // Verification successful
          } catch (error) {
            // If verification fails, try the next secret.
            // We can safely ignore jwt.JsonWebTokenError here as it just means this secret didn't work.
            // We might want to log other types of errors if they occur during verification.
            if (!(error instanceof jwt.JsonWebTokenError)) {
              yield* _(
                Effect.logError(
                  `Unexpected error during JWT verification with secret: ${secret.substring(0, 5)}...`,
                  error,
                ),
              );
            }
          }
        }
        // If loop finishes without returning, no secret worked
        return yield* Effect.fail(new Error("Invalid or expired token"));
      });

    const verify = (token: string) =>
      Effect.gen(function* (_) {
        // Verify the JWT first
        const decodedToken = yield* verifyJwt(token);

        const session = yield* sessionService.findByToken(token);
        if (!session) {
          return yield* Effect.fail(new Error("Session not found"));
        }

        const user = yield* userService.findById(decodedToken.userId);
        if (!user) {
          return yield* Effect.fail(new Error("User associated with token not found"));
        }
        return yield* Effect.succeed({ user, session });
      });

    const login = (email: string, password: string) =>
      Effect.gen(function* (_) {
        const attempt = yield* userService.verifyPassword(email, password);
        if (!attempt) {
          return { err: new Error("Login failed"), success: false } as const;
        }
        const user = yield* userService.findByEmail(email);
        if (!user) {
          // This case should ideally not happen if verifyPassword succeeded, but for safety
          return { err: new Error("User not found after password verification"), success: false } as const;
        }

        // Generate the JWT
        const expiresIn = ms("7 Days"); // Configure your JWT expiration time
        const accessToken = yield* generateJwt(user.id, expiresIn);

        const expiresAt = dayjs().add(7, "days").toDate(); // Match this with JWT expiration

        const lastOrganization = yield* userService.findLastOrganization(user.id);
        const lastWarehouse = yield* userService.findLastWarehouse(user.id);
        const session = yield* sessionService.create({
          expiresAt,
          userId: user.id,
          access_token: accessToken,
          current_organization_id: lastOrganization?.id ?? null,
          current_warehouse_id: lastWarehouse?.id ?? null,
        });
        if (!session) {
          return { err: new Error("Failed to create session record"), success: false } as const;
        }

        return { success: true, user, session: { access_token: accessToken, expiresAt: expiresAt } } as const; // Return the JWT and its expiration
      });

    const removeSession = (token: string) =>
      Effect.gen(function* (_) {
        // If you are using JWTs with a blocklist, this is where you would add the token's JTI to the blocklist.
        // If you are still using database sessions to track active tokens, you'd remove the session record.

        // Assuming you are still using database sessions for tracking/blocklisting:
        const session = yield* sessionService.findByToken(token);
        if (!session) {
          return { err: new Error("Session not found"), success: false } as const;
        }
        const removedSession = yield* sessionService.remove(session.id);
        return { success: true, session: removedSession } as const;

        // we could use JTI to blocklist the session... (for now we wont do that, too much hastle to set it up)
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

        // Generate the JWT
        const expiresIn = ms("7 Days"); // Configure your JWT expiration time
        const accessToken = yield* generateJwt(attempt.id, expiresIn);

        // Create a session record (if needed for blocklisting/tracking)
        const expiresAt = dayjs().add(7, "days").toDate(); // Match this with JWT expiration
        const session = yield* sessionService.create({
          expiresAt,
          userId: attempt.id,
          access_token: accessToken, // Store the JWT in the database session record
        });

        if (!session) {
          return { err: new Error("Failed to create session record"), success: false } as const;
        }

        return { success: true, user: attempt, session: { access_token: accessToken, expiresAt: expiresAt } } as const; // Return the JWT and its expiration
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
