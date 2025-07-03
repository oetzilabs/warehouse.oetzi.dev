import { action, json, query } from "@solidjs/router";
import { OrganizationCreateSchema, OrganizationUpdateSchema } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { SessionLive, SessionService } from "@warehouseoetzidev/core/src/entities/sessions";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Effect, Layer } from "effect";
import { InferInput } from "valibot";
import { getAuthenticatedUser } from "./auth";
import { run, runWithSession } from "./utils";

// Get all organizations for the authenticated user
export const getOrganizations = query(() => {
  "use server";
  return runWithSession(
    "@query/organizations",
    Effect.fn(
      function* (session) {
        const service = yield* UserService;
        const user = yield* service.findById(session.user_id);
        return user.orgs.map((o) => o.org);
      },
      (effect) => effect.pipe(Effect.provide(UserLive)),
    ),
    json([]),
  );
}, "organizations");

// Get organization by slug
export const getOrganizationBySlug = query((slug: string) => {
  "use server";
  return run(
    "@query/organization-by-slug",
    Effect.gen(function* (_) {
      const service = yield* OrganizationService;
      return yield* service.findBySlug(slug);
    }).pipe(Effect.provide(OrganizationLive)),
    undefined,
  );
}, "organization-by-slug");

// Create organization and update session
export const createOrganization = action((data: InferInput<typeof OrganizationCreateSchema>) => {
  "use server";
  return runWithSession(
    "@action/create-organization",
    Effect.fn(
      function* (session) {
        const service = yield* OrganizationService;
        const orgCreated = yield* service.create(data, session.user_id);
        const sessionService = yield* SessionService;
        const updatedSession = yield* sessionService.update({
          id: session.session_id,
          current_organization_id: orgCreated.id,
        });
        if (!updatedSession) {
          return yield* Effect.fail(new Error("Failed to update session"));
        }
        return json(orgCreated, {
          revalidate: [getCurrentOrganization.key, getAuthenticatedUser.key],
        });
      },
      (effect) => effect.pipe(Effect.provide(OrganizationLive), Effect.provide(SessionLive)),
    ),
    json(undefined, {
      revalidate: [getCurrentOrganization.key, getAuthenticatedUser.key],
    }),
  );
});

// Update organization
export const updateOrganization = action((data: InferInput<typeof OrganizationUpdateSchema>) => {
  "use server";
  return run(
    "@action/update-organization",
    Effect.gen(function* (_) {
      const service = yield* OrganizationService;
      const org = yield* service.update(data);
      return json(org, {
        revalidate: [getOrganizations.key, getOrganizationBySlug.keyFor(org.slug), getCurrentOrganization.key],
      });
    }).pipe(Effect.provide(OrganizationLive)),
    json(undefined, {
      revalidate: [getOrganizations.key, getOrganizationBySlug.key, getCurrentOrganization.key],
    }),
  );
});

// Get current organization from session
export const getCurrentOrganization = query(() => {
  "use server";
  return runWithSession(
    "@query/current-organization",
    Effect.fn(
      function* (session) {
        const service = yield* OrganizationService;
        return yield* service.findById(session.current_organization_id);
      },
      (effect) => effect.pipe(Effect.provide(OrganizationLive)),
    ),
    undefined,
  );
}, "current-organization");

// Set current organization (returns org if found)
export const setCurrentOrganization = action((id: string) => {
  "use server";
  return run(
    "@action/set-current-organization",
    Effect.gen(function* (_) {
      const service = yield* OrganizationService;
      const org = yield* service.findById(id);
      if (!org) throw new Error("Organization not found");
      return org;
    }).pipe(Effect.provide(OrganizationLive)),
    undefined,
  );
});

// Delete organization
export const deleteOrganization = action((id: string) => {
  "use server";
  return run(
    "@action/delete-organization",
    Effect.gen(function* (_) {
      const service = yield* OrganizationService;
      return yield* service.safeRemove(id);
    }).pipe(Effect.provide(OrganizationLive)),
    undefined,
  );
});
