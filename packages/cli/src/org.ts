import { Args, Command, Options } from "@effect/cli";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Effect, Layer } from "effect";

dayjs.extend(localizedFormat);

const orgArg = Args.text({ name: "org" }).pipe(Args.withDescription("The org ID"));
// const deviceArg = Args.text({ name: "device" }).pipe(Args.withDescription("The device ID"));

const listOrganizations = Command.make("list").pipe(
  Command.withDescription("List all devices under a org"),
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
  Command.withDescription("Show detailed info for a specific device"),
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

export const orgCommand = Command.make("org").pipe(Command.withSubcommands([listOrganizations, showOrganization]));
