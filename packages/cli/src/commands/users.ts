import { Command, Options, Prompt } from "@effect/cli";
import { OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Cause, Console, Effect, Exit, Option } from "effect";
import { formatOption, keysOption, orgOption, output, transformDates } from "./shared";
import { stockCommand } from "./stock";
import { warehouseCommand } from "./warehouse";

const findByNameOption = Options.text("name").pipe(Options.withDescription("Find an user by name"), Options.optional);

const findByEmailOption = Options.text("email").pipe(
  Options.withDescription("Find an user by email"),
  Options.optional,
);

const findByVerifiedOption = Options.boolean("verified", { negationNames: ["non-verified"] }).pipe(
  Options.withDescription("Find an user by verified status"),
  Options.optional,
);

const userIdOption = Options.text("id").pipe(Options.withDescription("The user ID"));

export const userCommand = Command.make("user").pipe(
  Command.withSubcommands([
    Command.make(
      "find",
      {
        org: orgOption,
        name: findByNameOption,
        email: findByEmailOption,
        verified: findByVerifiedOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/user.find")(function* ({ name, email, format, org, keys, verified }) {
        const repo = yield* UserService;
        const n = Option.getOrUndefined(name);
        const e = Option.getOrUndefined(email);
        const v = Option.getOrUndefined(verified);
        yield* Console.log(`Searching for ${n} ${e} ${v}`);
        const users = yield* repo.findBy({ name: n, email: e, verified: v });
        return yield* output(users, format, keys);
      }),
    ),
    Command.make(
      "list",
      {
        org: orgOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/user.list")(function* ({ org, format, keys }) {
        const repo = yield* OrganizationService;
        const _org = yield* repo.findById(org);
        return yield* output(_org.users, format, keys);
      }),
    ),
    Command.make(
      "list-all",
      {
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/user.list")(function* ({ format, keys }) {
        const repo = yield* UserService;
        const users = yield* repo.all();
        return yield* output(users, format, keys);
      }),
    ),
    Command.make(
      "show",
      { userId: userIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/user.show")(function* ({ userId, format, keys }) {
        const repo = yield* UserService;
        const user = yield* repo.findById(userId);
        return yield* output(user, format, keys);
      }),
    ),
    Command.make(
      "verify",
      { userId: userIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/user.show")(function* ({ userId, format, keys }) {
        const repo = yield* UserService;
        const user = yield* repo.update(userId, { id: userId, verifiedAt: new Date() });
        return yield* output(user, format, keys);
      }),
    ),
    Command.make(
      "reset-password",
      { userId: userIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/user.show")(function* ({ userId, format, keys }) {
        const repo = yield* UserService;
        // const user = yield* repo.update(userId, { id: userId, verifiedAt: new Date() });
        // return yield* output(user, format, keys);
        const newPassword = yield* Prompt.text({ message: "New password" });
        const newPasswordConfirm = yield* Prompt.text({ message: "Confirm new password" });
        if (newPassword !== newPasswordConfirm) {
          return yield* Exit.failCause(Cause.fail("Passwords do not match"));
        }
        return yield* Exit.failCause(Cause.fail("Not implemented"));
      }),
    ),
    Command.make(
      "notify",
      { userId: userIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/user.show")(function* ({ userId, format, keys }) {
        const repo = yield* UserService;
        // const user = yield* repo.update(userId, { id: userId, verifiedAt: new Date() });
        // return yield* output(user, format, keys);
        const title = yield* Prompt.text({ message: "Title" });
        const message = yield* Prompt.text({ message: "Message" });

        return yield* Exit.failCause(Cause.fail("Not implemented"));
      }),
    ),
  ]),
);
