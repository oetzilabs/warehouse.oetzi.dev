import { Command, Options, Prompt } from "@effect/cli";
import { user_status_enun_values } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { MessagingLive, MessagingService } from "@warehouseoetzidev/core/src/entities/messaging";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Cause, Console, Effect, Exit, Layer, Option } from "effect";
import { formatOption, keysOption, orgOption, output, transformDates } from "./shared";

const optionalOrgOption = Options.text("org").pipe(Options.withDescription("The organization ID"), Options.optional);

const findByNameOption = Options.text("name").pipe(Options.withDescription("Find an user by name"), Options.optional);

const findByEmailOption = Options.text("email").pipe(
  Options.withDescription("Find an user by email"),
  Options.optional,
);

const findByVerifiedOption = Options.boolean("verified", { negationNames: ["non-verified"], ifPresent: true }).pipe(
  Options.withDescription("Find an user by verification"),
  Options.optional,
);

const userIdOption = Options.text("id").pipe(Options.withDescription("The user ID"));

const findByStatusOption = Options.choice("status", user_status_enun_values).pipe(
  Options.withDescription("Find an user by status"),
  Options.optional,
);

const userCommand = Command.make("user").pipe(
  Command.withSubcommands([
    Command.make(
      "find",
      {
        name: findByNameOption,
        email: findByEmailOption,
        status: findByStatusOption,
        verified: findByVerifiedOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/user.find")(function* ({ name, email, format, status, keys, verified }) {
        const repo = yield* UserService;
        const n = Option.getOrUndefined(name);
        const e = Option.getOrUndefined(email);
        // somehow the `Option.getOrUndefined` is not working here.
        let v = Option.getOrUndefined(verified);
        const hasVerifiedOrNonVerified = Bun.argv.includes("--verified") || Bun.argv.includes("--non-verified");
        if (!hasVerifiedOrNonVerified) {
          v = undefined;
        }
        const s = Option.getOrUndefined(status);
        yield* Console.log(`Searching for ${n} ${e} ${v} ${s}`);
        const users = yield* repo.findBy({ name: n, email: e, verified: v, status: s });
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
      "send-verification",
      { userId: userIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/user.send-verification")(function* ({ userId, format, keys }) {
        const repo = yield* UserService;
        const user = yield* repo.findById(userId);
        const messagingService = yield* MessagingService;
        const message = yield* messagingService.create("verify-email", { name: user.name, email: user.email });
        const verification = yield* messagingService.send(message);
        return yield* output(verification, format, keys);
      }),
    ),
    Command.make(
      "verify",
      { userId: userIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/user.verify")(function* ({ userId, format, keys }) {
        const repo = yield* UserService;
        const user = yield* repo.update(userId, { id: userId, verifiedAt: new Date() });
        return yield* output(user, format, keys);
      }),
    ),
    Command.make(
      "reset-password",
      { userId: userIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/user.reset-password")(function* ({ userId, format, keys }) {
        const repo = yield* UserService;
        // const user = yield* repo.update(userId, { id: userId, verifiedAt: new Date() });
        // return yield* output(user, format, keys);
        const newPassword = yield* Prompt.text({ message: "New password" });
        const newPasswordConfirm = yield* Prompt.text({ message: "Confirm new password" });
        if (newPassword !== newPasswordConfirm) {
          return yield* Exit.failCause(Cause.fail("Passwords do not match"));
        }
        const messageService = yield* MessagingService;
        const user = yield* repo.findById(userId);
        const updatedUser = yield* repo.update(userId, { id: userId, password: newPassword });
        const userMessage = yield* messageService.create("reset-password", {
          name: user.name,
          email: user.email,
          password: newPassword,
        });
        const verification = yield* messageService.send(userMessage);
        return yield* output(verification, format, keys);
      }),
    ),
    Command.make(
      "notify",
      { userId: userIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/user.notify")(function* ({ userId, format, keys }) {
        const repo = yield* UserService;
        // const user = yield* repo.update(userId, { id: userId, verifiedAt: new Date() });
        // return yield* output(user, format, keys);
        const title = yield* Prompt.text({ message: "Title" });
        const message = yield* Prompt.text({ message: "Message" });

        return yield* Exit.failCause(Cause.fail("Not implemented"));
      }),
    ),
    Command.make(
      "create",
      {
        org: optionalOrgOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/user.create")(function* ({ org, format, keys }) {
        const userService = yield* UserService;
        const name = yield* Prompt.text({ message: "Name" });
        const email = yield* Prompt.text({ message: "Email" });

        const isTheUserEmailAlreadyRegistered = yield* userService
          .findByEmail(email)
          .pipe(Effect.catchTag("UserNotFoundViaEmail", () => Effect.succeed(undefined)));
        if (isTheUserEmailAlreadyRegistered) {
          return yield* Exit.failCause(Cause.fail("Email already registered"));
        }

        const password = yield* Prompt.text({ message: "Password" });
        const passwordConfirm = yield* Prompt.text({ message: "Confirm password" });
        if (password !== passwordConfirm) {
          return yield* Exit.failCause(Cause.fail("Passwords do not match"));
        }

        const repo = yield* OrganizationService;
        const createdUser = yield* userService.create({
          name,
          email,
          password,
        });

        const _org = Option.getOrUndefined(org);

        if (_org) {
          const connectedToOrganization = yield* repo
            .addUser(createdUser.id)
            .pipe(Effect.provide(Layer.succeed(OrganizationId, _org)));
          if (!connectedToOrganization) {
            return yield* Exit.failCause(Cause.fail("Could not connect organization"));
          }
        } else {
          const doYouWantToJoinAnOrganization = yield* Prompt.confirm({
            message: "Do you want to join an organization?",
          });

          if (doYouWantToJoinAnOrganization) {
            const listOfOrganizations = yield* repo.all();
            const chosenOrganization = yield* Prompt.select({
              message: "Choose an organization",
              choices: listOfOrganizations.map((org) => ({
                title: org.name,
                value: org.id,
                description: org.description ?? "No description for this organization",
              })),
            });

            const connectedOrganization = yield* repo
              .addUser(createdUser.id)
              .pipe(Effect.provide(Layer.succeed(OrganizationId, chosenOrganization)));
            if (!connectedOrganization) {
              return yield* Exit.failCause(Cause.fail("Could not connect organization"));
            }
          }
        }

        const user = yield* userService.findById(createdUser.id);

        return yield* output(user, format, keys);
      }),
    ),
    Command.make(
      "ban",
      { userId: userIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/user.ban")(function* ({ userId, format, keys }) {
        const repo = yield* UserService;
        const user = yield* repo.findById(userId);
        const updatedUser = yield* repo.update(userId, { id: userId, status: "suspended" });
        return yield* output(updatedUser, format, keys);
      }),
    ),
  ]),
);

export default userCommand;
export const layers = Layer.mergeAll(UserLive, OrganizationLive, MessagingLive);
