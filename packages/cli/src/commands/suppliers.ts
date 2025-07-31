import { Command, Options, Prompt } from "@effect/cli";
import { supplier_status_enum_values } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { SupplierLive, SupplierService } from "@warehouseoetzidev/core/src/entities/suppliers";
import { Cause, Console, Effect, Exit, Layer, Option } from "effect";
import { formatOption, keysOption, orgOption, output, transformDates } from "./shared";

const findByNameOption = Options.text("name").pipe(
  Options.withDescription("Find an supplier by name"),
  Options.optional,
);

const findByEmailOption = Options.text("email").pipe(
  Options.withDescription("Find an supplier by email"),
  Options.optional,
);

// const findByVerifiedOption = Options.boolean("verified", { negationNames: ["non-verified"] }).pipe(
//   Options.withDescription("Find an supplier by verified status"),
//   Options.optional,
// );

const findByContactOption = Options.text("contact").pipe(
  Options.withDescription("Find an supplier by contact"),
  Options.optional,
);

const findByNoteOption = Options.text("note").pipe(
  Options.withDescription("Find an supplier by note"),
  Options.optional,
);

const activeOption = Options.boolean("active", { negationNames: ["inactive"] }).pipe(
  Options.withDescription("Find an supplier by active status"),
  Options.optional,
);

const blacklistedOption = Options.boolean("blacklisted", { negationNames: ["non-blacklisted"] }).pipe(
  Options.withDescription("Find an supplier by blacklisted status"),
  Options.optional,
);

const supplierIdOption = Options.text("id").pipe(Options.withDescription("The supplier ID"));

const supplierCommand = Command.make("supplier").pipe(
  Command.withSubcommands([
    Command.make(
      "find",
      {
        org: orgOption,
        name: findByNameOption,
        email: findByEmailOption,
        contact: findByContactOption,
        note: findByNoteOption,
        active: activeOption,
        blacklisted: blacklistedOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/supplier.find")(function* ({
        name,
        email,
        format,
        org,
        keys,
        contact,
        note,
        active,
        blacklisted,
      }) {
        const repo = yield* SupplierService;
        const n = Option.getOrUndefined(name);
        const e = Option.getOrUndefined(email);
        const c = Option.getOrUndefined(contact);
        const n2 = Option.getOrUndefined(note);
        const a = Option.getOrUndefined(active);
        const b = Option.getOrUndefined(blacklisted);
        const suppliers = yield* repo.findBy({ name: n, email: e, contact: c, note: n2, active: a, blacklisted: b });
        return yield* output(suppliers, format, keys);
      }),
    ),
    Command.make(
      "list",
      {
        org: orgOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/supplier.list")(function* ({ org, format, keys }) {
        const repo = yield* OrganizationService;
        const _org = yield* repo.findById(org);
        return yield* output(
          _org.supps.map((s) => s.supplier),
          format,
          keys,
        );
      }),
    ),
    Command.make(
      "list-all",
      {
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/supplier.list")(function* ({ format, keys }) {
        const repo = yield* SupplierService;
        const suppliers = yield* repo.all();
        return yield* output(suppliers, format, keys);
      }),
    ),
    Command.make(
      "show",
      { supplierId: supplierIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/supplier.show")(function* ({ supplierId, format, keys }) {
        const repo = yield* SupplierService;
        const supplier = yield* repo.findByIdWithoutOrg(supplierId);
        return yield* output(supplier, format, keys);
      }),
    ),
    Command.make(
      "set-status",
      { supplierId: supplierIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/supplier.unblacklist")(function* ({ supplierId, format, keys }) {
        const repo = yield* SupplierService;
        const chosenStatus = yield* Prompt.select({
          message: "Status",
          choices: supplier_status_enum_values.map((x) => ({
            title: x,
            value: x,
          })),
        });
        const supplier = yield* repo.update({ id: supplierId, status: chosenStatus });
        return yield* output(supplier, format, keys);
      }),
    ),
    Command.make(
      "notify",
      { supplierId: supplierIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/supplier.notify")(function* ({ supplierId, format, keys }) {
        const repo = yield* SupplierService;
        // const supplier = yield* repo.update(supplierId, { id: supplierId, verifiedAt: new Date() });
        // return yield* output(supplier, format, keys);
        const title = yield* Prompt.text({ message: "Title" });
        const message = yield* Prompt.text({ message: "Message" });

        return yield* Exit.failCause(Cause.fail("Not implemented"));
      }),
    ),
  ]),
);

export default supplierCommand;
export const layers = Layer.mergeAll(SupplierLive, OrganizationLive);
