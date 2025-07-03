import dayjs from "dayjs";
import { Effect, Layer, Redacted } from "effect";
import jwt from "jsonwebtoken";
import ms from "ms";
import { WarehouseConfig, WarehouseConfigLive } from "../config";
import { FacilityLive, FacilityService } from "../facilities";
import { OrganizationLive, OrganizationService } from "../organizations";
import { OrganizationId } from "../organizations/id";
import { SessionLive, SessionService } from "../sessions";
import { UserLive, UserService } from "../users";
import { WarehouseLive, WarehouseService } from "../warehouses";
import {
  AuthInvalidToken,
  AuthLoginFailed,
  AuthNoJwtSecrets,
  AuthSessionCreateFailed,
  AuthSessionNotFound,
  AuthSignupFailed,
  AuthUserAlreadyExists,
  AuthUserNotFound,
} from "./errors";

interface JwtPayload {
  userId: string;
}

export class AuthService extends Effect.Service<AuthService>()("@warehouse/auth", {
  effect: Effect.gen(function* (_) {
    const sessionService = yield* SessionService;
    const userService = yield* UserService;
    const C = yield* WarehouseConfig;
    const config = yield* C.getConfig;
    const jwtSecrets = [Redacted.value(config.JWTSecret1), Redacted.value(config.JWTSecret2)];

    if (jwtSecrets.length === 0) {
      return yield* Effect.fail(
        new AuthNoJwtSecrets({ message: "JWT secrets are not configured. Cannot start Auth Service." }),
      );
    }

    // Function to generate a JWT
    const generateJwt = Effect.fn("@warehouse/auth/generateJwt")(function* (userId: string, expiresIn: number) {
      const payload: JwtPayload = { userId };
      return jwt.sign(payload, jwtSecrets[0], { expiresIn });
    });

    // Function to verify a JWT
    const verifyJwt = Effect.fn("@warehouse/auth/verifyJwt")(function* (token: string) {
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
      return yield* Effect.fail(new AuthInvalidToken({ message: "Invalid or expired token" }));
    });

    const verify = Effect.fn("@warehouse/auth/verify")(function* (token: string) {
      // Verify the JWT first
      const decodedToken = yield* verifyJwt(token);

      const session = yield* sessionService.findByToken(token);
      if (!session) {
        return yield* Effect.fail(new AuthSessionNotFound({ token }));
      }

      const user = yield* userService.findById(decodedToken.userId);
      // console.dir(user, { depth: Infinity });
      if (!user) {
        return yield* Effect.fail(new AuthUserNotFound({ userId: decodedToken.userId }));
      }
      return yield* Effect.succeed({ user, session });
    });

    const login = Effect.fn("@warehouse/auth/login")(function* (email: string, password: string) {
      const attempt = yield* userService.verifyPassword(email, password);
      if (!attempt) {
        return yield* Effect.fail(new AuthLoginFailed({ email }));
      }
      const user = yield* userService.findByEmail(email);
      if (!user) {
        // This case should ideally not happen if verifyPassword succeeded, but for safety
        return yield* Effect.fail(new AuthUserNotFound({ userId: email }));
      }

      // Generate the JWT
      const expiresIn = ms("7 Days"); // Configure your JWT expiration time
      const accessToken = yield* generateJwt(user.id, expiresIn);

      const expiresAt = dayjs().add(7, "days").toDate(); // Match this with JWT expiration

      const lastOrganization = yield* userService.findLastOrganization(user.id);
      const lastWarehouse = yield* userService.findLastWarehouse(user.id);
      const lastFacility = yield* userService.findLastFacility(user.id);
      const session = yield* sessionService.create({
        expiresAt,
        userId: user.id,
        access_token: accessToken,
        current_organization_id: lastOrganization?.id ?? null,
        current_warehouse_id: lastWarehouse?.id ?? null,
        current_warehouse_facility_id: lastFacility?.id ?? null,
      });
      if (!session) {
        return yield* Effect.fail(new AuthSessionCreateFailed({ userId: user.id }));
      }

      return { user, session: { access_token: accessToken, expiresAt: expiresAt } } as const; // Return the JWT and its expiration
    });

    const removeSession = Effect.fn("@warehouse/auth/removeSession")(function* (token: string) {
      // If you are using JWTs with a blocklist, this is where you would add the token's JTI to the blocklist.
      // If you are still using database sessions to track active tokens, you'd remove the session record.

      // Assuming you are still using database sessions for tracking/blocklisting:
      const session = yield* sessionService.findByToken(token);
      if (!session) {
        return yield* Effect.fail(new AuthSessionNotFound({ token }));
      }
      const removedSession = yield* sessionService.remove(session.id);
      return { success: true, session: removedSession } as const;

      // we could use JTI to blocklist the session... (for now we wont do that, too much hastle to set it up)
    });

    const signup = Effect.fn("@warehouse/auth/signup")(
      function* (email: string, password: string) {
        let user = yield* userService
          .findByEmail(email)
          .pipe(Effect.catchTag("UserNotFoundViaEmail", () => Effect.succeed(undefined)));
        let organizationId: string | null = null;
        let warehouseId: string | null = null;
        let facilityId: string | null = null;
        if (user) {
          organizationId = yield* userService.findLastOrganization(user.id).pipe(Effect.map((o) => o.id)) ?? null;
          warehouseId = yield* userService.findLastWarehouse(user.id).pipe(Effect.map((w) => w.id)) ?? null;
          facilityId = yield* userService.findLastFacility(user.id).pipe(Effect.map((f) => f.id)) ?? null;
        } else {
          const attempt = yield* userService.create({ email, password, name: email, status: "active" });
          if (!attempt) {
            return yield* Effect.fail(new AuthSignupFailed({ email, message: "Failed to create user" }));
          }
          user = yield* userService.findByEmail(email);
          yield* Effect.log("User created", { email });

          // create default organization, warehouse, and facility, easier for the user to get onboarded
          const organizationService = yield* OrganizationService;
          const organization = yield* organizationService.create({ name: "Default Organization" }, user.id);
          yield* Effect.log("Organization created", { organizationId: organization.id, email });
          const orgId = Layer.succeed(OrganizationId, organization.id);
          const warehouseService = yield* WarehouseService;
          const warehouse = yield* warehouseService
            .create({ name: "Default Warehouse" }, user.id)
            .pipe(Effect.provide(orgId));
          yield* Effect.log("Warehouse created", { warehouseId: warehouse.id, email });
          const facilityService = yield* FacilityService;
          const facility = yield* facilityService.create({
            name: "Default Facility",
            warehouse_id: warehouse.id,
            ownerId: user.id,
          });
          yield* Effect.log("Facility created", { facilityId: facility.id, email });
          organizationId = organization.id;
          warehouseId = warehouse.id;
          facilityId = facility.id;
        }

        // Generate the JWT
        const expiresIn = ms("7 Days"); // Configure your JWT expiration time
        const accessToken = yield* generateJwt(user.id, expiresIn);

        // Create a session record (if needed for blocklisting/tracking)
        const expiresAt = dayjs().add(7, "days").toDate(); // Match this with JWT expiration
        const session = yield* sessionService.create({
          expiresAt,
          userId: user.id,
          access_token: accessToken, // Store the JWT in the database session record
          current_organization_id: organizationId,
          current_warehouse_id: warehouseId,
          current_warehouse_facility_id: facilityId,
        });

        if (!session) {
          return yield* Effect.fail(new AuthSessionCreateFailed({ userId: user.id }));
        }

        return { user: user, session: { access_token: accessToken, expiresAt: expiresAt } } as const; // Return the JWT and its expiration
      },
      (effect) => effect.pipe(Effect.provide([OrganizationLive, WarehouseLive, FacilityLive])),
    );

    return {
      verify,
      login,
      signup,
      removeSession,
    } as const;
  }),
  dependencies: [SessionLive, UserLive, WarehouseConfigLive],
}) {}

export const AuthLive = AuthService.Default;
