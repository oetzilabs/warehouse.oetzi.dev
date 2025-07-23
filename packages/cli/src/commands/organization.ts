import { Command, Options } from "@effect/cli";
import { OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { Console, Effect, Option } from "effect";
import { devicesCommand } from "./device";
import { formatOption, orgOption, output, transformDates } from "./shared";
import { stockCommand } from "./stock";
import { warehouseCommand } from "./warehouse";

const findByNameOption = Options.text("name").pipe(
  Options.withDescription("Find an organization by name"),
  Options.optional,
);

const orgCmd = Command.make("org", { org: orgOption }, () => Effect.succeed(undefined));

export const orgCommand = Command.make("org").pipe(
  Command.withSubcommands([
    Command.make("find", { name: findByNameOption, format: formatOption }, ({ name, format }) =>
      Effect.flatMap(
        orgCmd,
        Effect.fn("@warehouse/cli/org.find")(function* () {
          const repo = yield* OrganizationService;
          const n = Option.getOrUndefined(name);
          const organizations = yield* repo.findBy({ name: n });
          return yield* output(organizations, format);
        }),
      ),
    ),
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
      { org: orgOption, format: formatOption },
      Effect.fn("@warehouse/cli/org.show")(function* ({ org, format }) {
        const repo = yield* OrganizationService;
        const organization = yield* repo.findById(org);
        return yield* output(organization, format);
      }),
    ),
    warehouseCommand,
    stockCommand,
    devicesCommand,
  ]),
);
