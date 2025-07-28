import { Args, Command, Options, Prompt } from "@effect/cli";
import { FileSystem, Path } from "@effect/platform";
import { customer_order_status_enum_values } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { CustomerOrderService } from "@warehouseoetzidev/core/src/entities/orders";
import { OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Cause, Console, Effect, Exit, Layer, Option } from "effect";
import { formatOption, keysOption, orgOption, output } from "./shared";

dayjs.extend(localizedFormat);

const orderIdOption = Options.text("id").pipe(Options.withDescription("The order ID"));

const findByCustomerOption = Options.text("customer").pipe(
  Options.withDescription("Find an order by customer"),
  Options.optional,
);

const findBySaleOption = Options.text("sale").pipe(Options.withDescription("Find an order by sale"), Options.optional);

const findByStatusOption = Options.choice("status", customer_order_status_enum_values).pipe(
  Options.withDescription("Find an order by status"),
  Options.optional,
);

const findByOrganizationOption = Options.text("organization").pipe(
  Options.withDescription("Find an order by organization"),
  Options.optional,
);

const sizeOption = Options.choice("size", ["A4", "A5"]).pipe(
  Options.withDescription("Choose a size for the PDF generation."),
  Options.optional,
);

const overrideOption = Options.boolean("override", { ifPresent: true }).pipe(
  Options.withDescription("Override the file of the pdf generation output"),
  Options.optional,
);

const orientationOption = Options.choice("size", ["landscape", "portrait"]).pipe(
  Options.withDescription("Choose a orientation for the PDF generation"),
  Options.optional,
);

const locationOption = Options.text("location").pipe(
  Options.withDescription("Choose a location for the file to be saved to"),
  Options.optional,
);

export const orderCommand = Command.make("order").pipe(
  Command.withSubcommands([
    Command.make(
      "find",
      {
        customer: findByCustomerOption,
        organization: findByOrganizationOption,
        sale: findBySaleOption,
        status: findByStatusOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/order.find")(function* ({ format, keys, customer, organization, sale, status }) {
        const repo = yield* CustomerOrderService;
        // const n = Option.getOrUndefined(name);
        // const d = Option.getOrUndefined(description);
        const c = Option.getOrUndefined(customer);
        const o = Option.getOrUndefined(organization);
        const s = Option.getOrUndefined(sale);
        const st = Option.getOrUndefined(status);

        const products = yield* repo.findBy({ customerId: c, organizationId: o, saleId: s, status: st });
        return yield* output(products, format, keys);
      }),
    ),
    Command.make(
      "list",
      {
        org: orgOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/order.list")(function* ({ org, format, keys }) {
        const repo = yield* CustomerOrderService;
        const prods = yield* repo.findByOrganizationId().pipe(Effect.provide(Layer.succeed(OrganizationId, org)));
        return yield* output(prods, format, keys);
      }),
    ),
    Command.make(
      "list-all",
      {
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/order.list")(function* ({ format, keys }) {
        const repo = yield* CustomerOrderService;
        const products = yield* repo.all();
        return yield* output(products, format, keys);
      }),
    ),
    Command.make(
      "show",
      { orderId: orderIdOption, format: formatOption, keys: keysOption },
      Effect.fn("@warehouse/cli/order.show")(function* ({ orderId, format, keys }) {
        const repo = yield* CustomerOrderService;
        const order = yield* repo.findByIdWithoutOrg(orderId);
        return yield* output(order, format, keys);
      }),
    ),
    Command.make(
      "pdf",
      {
        orderId: orderIdOption,
        size: sizeOption,
        orientation: orientationOption,
        loc: locationOption,
        override: overrideOption,
      },
      Effect.fn("@warehouse/cli/order.show")(function* ({ orderId, orientation, size, loc, override }) {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const repo = yield* CustomerOrderService;
        const orgRepo = yield* OrganizationService;
        const order = yield* repo.findByIdWithoutOrg(orderId);
        const _org = yield* orgRepo.findById(order.organization_id);
        const _size = Option.getOrUndefined(size);
        const _orientation = Option.getOrUndefined(orientation);
        const buffer = yield* repo
          .generatePDF(order.id, _org, {
            page: { orientation: _orientation ?? "portrait", size: _size ?? "A4" },
          })
          .pipe(Effect.provide(Layer.succeed(OrganizationId, _org.id)));

        let location = Option.getOrUndefined(loc);
        if (!location) {
          location = yield* Prompt.text({
            message: "Where do you want to store the pdf?",
            validate: Effect.fn(function* (value) {
              const nonempty = value.length === 0;
              const isAbsolute = path.isAbsolute(value);
              const filepathParsed = path.parse(isAbsolute ? value : path.join(process.cwd(), value));
              const directory = filepathParsed.dir;
              const directoryExists = yield* fs.exists(directory).pipe(
                Effect.catchTags({
                  BadArgument: (cause) =>
                    Effect.fail("The directory of the filepath you wrote could not be checked if it exists"),
                  SystemError: (cause) =>
                    Effect.fail("The directory of the filepath you wrote could not be checked if it exists"),
                }),
              );
              const locationDoesNotExist = yield* fs.exists(value).pipe(
                Effect.map((x) => !x),
                Effect.catchTags({
                  BadArgument: (cause) =>
                    Effect.fail("The location of the filepath you wrote could not be checked if it exists"),
                  SystemError: (cause) =>
                    Effect.fail("The location of the filepath you wrote could not be checked if it exists"),
                }),
              );
              if (nonempty) return yield* Effect.fail("Please provide a path");
              if (!directoryExists)
                return yield* Effect.fail("The directory of the filepath you wrote does not exist.");
              if (locationDoesNotExist && !override)
                return yield* Effect.fail("This file already exists. To override please provide `--override`");
              return value;
            }),
          });
        }

        if (override) {
          const hasExtension = path.extname(location) === ".pdf";
          yield* fs.writeFile(hasExtension ? location : location.concat(".pdf"), buffer);
        }

        return;
      }),
    ),
  ]),
);
