import { Command, Options } from "@effect/cli";
import { OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { Console, Effect, Option } from "effect";
import { formatOption, keysOption, orgOption, output, transformDates } from "./shared";

const findByNameOption = Options.text("name").pipe(
  Options.withDescription("Find an organization by name"),
  Options.optional,
);

const orgIdOption = Options.text("id").pipe(Options.withDescription("The organization ID"));

const orgCmd = Command.make("org", { org: orgIdOption }, () => Effect.succeed(undefined));

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
      {
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/org.list")(function* ({ format, keys }) {
        const repo = yield* OrganizationService;
        const organizations = yield* repo.all();
        return yield* output(organizations, format, keys);
      }),
    ),
    Command.make(
      "show",
      { org: orgIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/org.show")(function* ({ org, format, keys }) {
        const repo = yield* OrganizationService;
        const organization = yield* repo.findById(org);
        return yield* output(organization, format, keys);
      }),
    ),
  ]),
);
