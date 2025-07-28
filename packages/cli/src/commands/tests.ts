import { Args, Command, Options } from "@effect/cli";
import { InventoryService } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Cause, Console, Effect, Exit, Layer } from "effect";
import { formatOption, keysOption, orgOption, output } from "./shared";

dayjs.extend(localizedFormat);

const dryRunOption = Options.boolean("dry-run", { ifPresent: true, aliases: ["dr"] }).pipe(
  Options.withDescription("This does a dry-run. It does not generate a PDF file from the report."),
  Options.optional,
);

export const testCommand = Command.make(
  "test",
  {
    dryRun: dryRunOption,
  },
  Effect.fn("@warehouse/cli/test")(function* ({ dryRun }) {
    /* TODO: We need to make a test run of the following scenario:
    - Creating a user, verifying them. 
    - Creating an organization, adding projects to the sortiment.
    - Creating a fake order, accepting/denying it.
    - Creating a PDF file for the order.
    - Adding/connecting (to) a supplier
    - Requesting supplies. Generating a PDF for the supply, the result of sending an E-Mail.
    - etc.
    */

    return yield* Exit.failCause(Cause.fail("This function is not implemented yet."));

    // return yield* output("This function is not implemented yet.", "text");
  }),
);
