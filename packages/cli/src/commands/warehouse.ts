import { Args, Command, Options } from "@effect/cli";
import { WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect } from "effect";
import { formatOption, keysOption, orgOption, output } from "./shared";

dayjs.extend(localizedFormat);

const warehouseOption = Options.text("warehouse").pipe(Options.withDescription("The warehouse ID"));

const whCmd = Command.make("warehouse", { org: orgOption }, () => Effect.succeed(undefined));

export const warehouseCommand = whCmd.pipe(
  Command.withSubcommands([
    Command.make(
      "list",
      {
        format: formatOption,
        keys: keysOption,
      },
      ({ format, keys }) =>
        Effect.flatMap(
          whCmd,
          Effect.fn("@warehouse/cli/wh.list")(function* ({ org }) {
            const repo = yield* WarehouseService;
            const warehouses = yield* repo.findByOrganizationId(org);
            return yield* output(warehouses, format, keys);
          }),
        ),
    ),
    Command.make("show", { wh: warehouseOption, format: formatOption, keys: keysOption }, ({ wh, format, keys }) =>
      Effect.flatMap(
        whCmd,
        Effect.fn("@warehouse/cli/wh.show")(function* ({ org }) {
          const repo = yield* WarehouseService;
          const warehouse = yield* repo.findById(wh);
          return yield* output(warehouse, format, keys);
        }),
      ),
    ),
  ]),
);
