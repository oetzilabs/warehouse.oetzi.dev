import { Command } from "@effect/cli";
import { OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect } from "effect";
import { devicesCommand } from "./device";
import { orgArg } from "./shared";
import { stockCommand } from "./stock";
import { warehouseCommand } from "./warehouse";

dayjs.extend(localizedFormat);

export const orgCommand = Command.make("org").pipe(
  Command.withSubcommands([
    Command.make(
      "list",
      {},
      Effect.fn("@warehouse/cli/org.list")(function* () {
        const repo = yield* OrganizationService;
        const organizations = yield* repo.all();
        if (!organizations) {
          console.log(`No organizations found`);
        } else {
          yield* Console.log(`Organizations:`);
          yield* Console.table(
            organizations.map((organization) => ({
              id: organization.id,
              name: organization.name,
              createdAt: dayjs(organization.createdAt).format("LLL"),
            })),
            ["id", "name", "createdAt"],
          );
        }
      }),
    ),
    Command.make(
      "show",
      { org: orgArg },
      Effect.fn("@warehouse/cli/org.show")(function* ({ org }) {
        const repo = yield* OrganizationService;
        const organization = yield* repo.findById(org);
        yield* Console.log(`Organization for org '${organization}':`);
        yield* Console.log(
          `  - ${organization.id}: name ${organization.name} | created at: ${dayjs(organization.createdAt).format("LLL")}`,
        );
      }),
    ),
    warehouseCommand,
    stockCommand,
    devicesCommand,
  ]),
);
