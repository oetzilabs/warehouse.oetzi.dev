import { action, json, query, redirect } from "@solidjs/router";
import { OrganizationCreateSchema } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { SessionLive, SessionService } from "@warehouseoetzidev/core/src/entities/sessions";
import { Effect } from "effect";
import { getRequestEvent } from "solid-js/web";
import { InferInput } from "valibot";
import { getAuthenticatedUser } from "./auth";
import { withSession } from "./session";

export const getOrganizationBySlug = query(async (slug: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const org = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(OrganizationService);
      return yield* service.findBySlug(slug);
    }).pipe(Effect.provide(OrganizationLive)),
  );
  return org;
}, "organization-by-slug");

export const createOrganization = action(async (data: InferInput<typeof OrganizationCreateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }

  const session = auth[1];
  if (!session) {
    throw new Error("You have to be logged in to perform this action.");
  }

  const org = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(OrganizationService);
      const orgCreated = yield* service.create(data, user.id);
      const sessionService = yield* _(SessionService);
      const updatedSession = yield* sessionService.update({ id: session.id, current_organization_id: orgCreated.id });
      if (!updatedSession) {
        return yield* Effect.fail(new Error("Failed to update session"));
      }
      return orgCreated;
    }).pipe(Effect.provide(OrganizationLive), Effect.provide(SessionLive)),
  );

  return json(org, {
    revalidate: [getCurrentOrganization.key, getAuthenticatedUser.key],
  });
});

export const getCurrentOrganization = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const session = auth[1];
  if (!session) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    return undefined;
  }
  const org = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(OrganizationService);
      return yield* service.findById(orgId);
    }).pipe(Effect.provide(OrganizationLive)),
  );
  return org;
}, "current-organization");

export const setCurrentOrganization = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const org = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(OrganizationService);
      return yield* service.findById(id);
    }).pipe(Effect.provide(OrganizationLive)),
  );
  if (!org) {
    throw new Error("Organization not found");
  }
  return org;
});

export const deleteOrganization = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const removedOrganization = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(OrganizationService);
      return yield* service.safeRemove(id);
    }).pipe(Effect.provide(OrganizationLive)),
  );
  return removedOrganization;
});

export const disconnectFromOrganization = action(async (orgId: string) => {
  "use server";

  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }

  const removedFromOrganization = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(OrganizationService);
      return yield* service.removeUser(orgId, user.id);
    }).pipe(Effect.provide(OrganizationLive)),
  );
  return removedFromOrganization;
});
