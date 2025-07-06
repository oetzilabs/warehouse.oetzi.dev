import { CustomResponse } from "@solidjs/router";
import { AuthLive, AuthService } from "@warehouseoetzidev/core/src/entities/authentication";
import { MissingConfig } from "@warehouseoetzidev/core/src/entities/config";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { createOtelLayer } from "@warehouseoetzidev/core/src/entities/otel";
import { Cause, Chunk, Config, Effect, Exit, Layer, Schema } from "effect";
import { getCookie, getEvent, getRequestFingerprint } from "vinxi/http";

class NoOrganization extends Schema.TaggedError<NoOrganization>()("NoOrganization", {
  message: Schema.optional(Schema.String),
}) {}
class NoUser extends Schema.TaggedError<NoUser>()("NoUser", { message: Schema.optional(Schema.String) }) {}
class NoSession extends Schema.TaggedError<NoSession>()("NoSession", { message: Schema.optional(Schema.String) }) {}
class NoSessionToken extends Schema.TaggedError<NoSessionToken>()("NoSessionToken", {
  message: Schema.optional(Schema.String),
}) {}

class NoVinxiEvent extends Schema.TaggedError<NoVinxiEvent>()("NoVinxiEvent", {
  message: Schema.optional(Schema.String),
}) {}
class NoFingerprint extends Schema.TaggedError<NoFingerprint>()("NoFingerprint", {
  message: Schema.optional(Schema.String),
}) {}

type FormattedError = { name: string; message: string };

const fingerprint = Effect.fn("fingerprint")(function* () {
  const e = getEvent();
  if (!e) {
    return yield* Effect.fail(new NoVinxiEvent());
  }
  const fp = yield* Effect.promise(() => getRequestFingerprint(e));
  if (!fp) {
    return yield* Effect.fail(new NoFingerprint());
  }
  return fp;
});

export const run = async <
  A,
  E extends {
    _tag: string;
    message?: string;
  },
  F extends A | ((error: FormattedError) => CustomResponse<A | FormattedError>),
>(
  name: string,
  program: Effect.Effect<A, E, OrganizationId>,
  onFailure: F,
) => {
  const otelUrl = Exit.match(
    await Effect.runPromiseExit(
      Effect.gen(function* () {
        const url = yield* Config.string("OTEL_URL")
          .pipe(Config.withDefault("http://localhost:4318/v1/traces"))
          .pipe(
            Effect.catchTags({
              ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "OTEL_URL" })),
            }),
          );
        if (!url) {
          return yield* Effect.fail(new Error("No OTEL_URL found in config"));
        }
        return url;
      }),
    ),
    {
      onSuccess: (url) => url,
      onFailure: (cause) => {
        console.error("Failed to get OTEL_URL from config", cause);
        return "http://localhost:4318/v1/traces";
      },
    },
  );

  const innerProgram = Effect.fn("auth-middleware")(
    function* () {
      const fp = yield* fingerprint();
      yield* Effect.annotateCurrentSpan("auth-middleware/fingerprint", fp);
      // yield* Effect.log("auth-middleware/fingerprint", fp);
      const sessionToken = getCookie("session_token");
      if (!sessionToken) {
        return yield* Effect.fail(new NoSessionToken({ message: "No session token" }));
      }

      const authService = yield* AuthService;
      const verified = yield* authService.verify(sessionToken);

      if (!verified.user) {
        return yield* Effect.fail(new NoUser({ message: "No user" }));
      }
      if (!verified.session) {
        return yield* Effect.fail(new NoSession({ message: "No session" }));
      }
      const orgId = verified.session.current_organization_id;
      if (!orgId) {
        return yield* Effect.fail(new NoOrganization({ message: "No organization" }));
      }
      const organizationId = Layer.succeed(OrganizationId, orgId);
      return yield* program.pipe(Effect.provide(organizationId));
    },
    (effect) => effect.pipe(Effect.provide([AuthLive, createOtelLayer(name, otelUrl)])),
  );

  const result = Exit.match(await Effect.runPromiseExit(innerProgram()), {
    onSuccess: (data) => data,
    onFailure: (cause) => {
      const errors = Chunk.toReadonlyArray(Cause.failures(cause));
      const es = errors.map((e) => ({ name: e._tag ?? "unknown", message: e.message ?? "unknown" }));
      // console.error(`${name} errors:`, errors, cause);
      if (typeof onFailure === "function") {
        return onFailure(es);
      }
      return onFailure;
    },
  });
  return result as A;
};

export const runWithSession = async <
  A,
  E extends {
    _tag: string;
    message?: string;
  },
  F extends A | ((error: FormattedError) => CustomResponse<A | FormattedError>),
>(
  name: string,
  program: (session: {
    user_id: string;
    session_id: string;
    current_organization_id: string;
    current_warehouse_id: string | null;
    current_facility_id: string | null;
  }) => Effect.Effect<A, E, OrganizationId>,
  onFailure: F,
) => {
  const otelUrl = Exit.match(
    await Effect.runPromiseExit(
      Effect.gen(function* () {
        const url = yield* Config.string("OTEL_URL")
          .pipe(Config.withDefault("http://localhost:4318/v1/traces"))
          .pipe(
            Effect.catchTags({
              ConfigError: (e) => Effect.fail(MissingConfig.make({ key: "OTEL_URL" })),
            }),
          );
        if (!url) {
          return yield* Effect.fail(new Error("No OTEL_URL found in config"));
        }
        return url;
      }),
    ),
    {
      onSuccess: (url) => url,
      onFailure: (cause) => {
        console.error("Failed to get OTEL_URL from config", cause);
        return "http://localhost:4318/v1/traces";
      },
    },
  );
  const innerProgram = Effect.fn("auth-middleware")(
    function* () {
      const fp = yield* fingerprint();
      yield* Effect.annotateCurrentSpan("auth-middleware/fingerprint", fp);
      const sessionToken = getCookie("session_token");
      if (!sessionToken) {
        return yield* Effect.fail(new NoSessionToken({ message: "No session token" }));
      }

      const authService = yield* AuthService;
      const verified = yield* authService.verify(sessionToken);

      if (!verified.user) {
        return yield* Effect.fail(new NoUser({ message: "No user" }));
      }

      if (!verified.session) {
        return yield* Effect.fail(new NoSession({ message: "No session" }));
      }
      const orgId = verified.session.current_organization_id;
      if (!orgId) {
        return yield* Effect.fail(new NoOrganization({ message: "No organization" }));
      }
      const organizationIdLayer = Layer.succeed(OrganizationId, orgId);
      return yield* program({
        user_id: verified.user.id,
        session_id: verified.session.id,
        current_organization_id: orgId,
        current_warehouse_id: verified.session.current_warehouse_id,
        current_facility_id: verified.session.current_warehouse_facility_id,
      }).pipe(Effect.provide(organizationIdLayer));
    },
    (effect) => effect.pipe(Effect.provide([AuthLive, createOtelLayer(name, otelUrl)])),
  );

  const result = Exit.match(await Effect.runPromiseExit(innerProgram()), {
    onSuccess: (data) => data,
    onFailure: (cause) => {
      const errors = Chunk.toReadonlyArray(Cause.failures(cause));
      const es = errors.map((e) => ({ name: e._tag ?? "unknown", message: e.message ?? "unknown" }));
      // console.error(es);
      if (typeof onFailure === "function") {
        return onFailure(es);
      }
      return onFailure;
    },
  });
  return result as A;
};
