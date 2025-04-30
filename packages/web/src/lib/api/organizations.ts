import { action, query, redirect } from "@solidjs/router";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { Effect } from "effect";
import { withSession } from "./session";

export const getOrganizationBySlug = query(async (slug: string) => {
  "use server";
  const user = await withSession();
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

export const setCurrentOrganization = action(async (id: string) => {
  "use server";
  const user = await withSession();
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
  const user = await withSession();
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

  const user = await withSession();
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
