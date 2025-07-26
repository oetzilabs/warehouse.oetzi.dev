import { Args, Command, Options } from "@effect/cli";
import { customer_order_status_enum_values } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { CustomerOrderService } from "@warehouseoetzidev/core/src/entities/orders";
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
        const product = yield* repo.findByIdWithoutOrg(orderId);
        return yield* output(product, format, keys);
      }),
    ),
  ]),
);
