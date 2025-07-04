import { action, json } from "@solidjs/router";
import { OrganizationUpdateSchema } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Effect } from "effect";
import { InferInput } from "valibot";
import { getAuthenticatedUser } from "./auth";
import { getCurrentOrganization, getOrganizationBySlug, getOrganizations } from "./organizations";
import { runWithSession } from "./utils";

// Update organization
export const updateOrganizationDetails = action((data: InferInput<typeof OrganizationUpdateSchema>) => {
  "use server";
  return runWithSession(
    "@action/update-organization",
    Effect.fn(
      function* (session) {
        const service = yield* OrganizationService;
        const userService = yield* UserService;
        const org = yield* service.update(data);
        yield* userService.update(session.user_id, {
          id: session.user_id,
          has_finished_onboarding: true,
        });
        return json(org, {
          revalidate: [getOrganizations.key, getOrganizationBySlug.keyFor(org.slug), getCurrentOrganization.key],
        });
      },
      (effect) => effect.pipe(Effect.provide([OrganizationLive, UserLive])),
    ),
    (errors) =>
      json(errors, {
        revalidate: [
          getOrganizations.key,
          getOrganizationBySlug.key,
          getCurrentOrganization.key,
          getAuthenticatedUser.key,
        ],
      }),
  );
});
