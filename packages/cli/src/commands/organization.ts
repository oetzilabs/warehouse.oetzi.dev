import { Command } from "@effect/cli";
import { OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Effect } from "effect";
import { orgArg } from "./shared";
import { stockCommand } from "./stock";
import { warehouseCommand } from "./warehouse";

dayjs.extend(localizedFormat);

const listOrganizations = Command.make("list").pipe(
  Command.withDescription("List all organizations"),
  Command.withHandler(() =>
    Effect.gen(function* () {
      const repo = yield* OrganizationService;
      const organizations = yield* repo.all();
      if (!organizations) {
        console.log(`No organizations found`);
      } else {
        console.log(`Organizations:`);
        for (const { id, createdAt, name } of organizations) {
          console.log(`  - ${id}: name ${name} | created at: ${dayjs(createdAt).format("LLL")}`);
        }
      }
    }),
  ),
);

const showOrganization = Command.make("show", { org: orgArg }).pipe(
  Command.withDescription("Show detailed info for a specific organization"),
  Command.withHandler(({ org }) =>
    Effect.gen(function* () {
      const repo = yield* OrganizationService;
      const organization = yield* repo.findById(org);
      if (!organization) {
        console.log(`No org found for org: ${org}`);
      } else {
        console.log(`Organization for org '${organization}':`);
        console.log(
          `  - ${organization.id}: name ${organization.name} | created at: ${dayjs(organization.createdAt).format("LLL")}`,
        );
      }
    }),
  ),
);

export const orgCommand = Command.make("org").pipe(
  Command.withSubcommands([listOrganizations, showOrganization, warehouseCommand, stockCommand]),
);
