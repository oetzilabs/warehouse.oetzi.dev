import { Args, Command, Options } from "@effect/cli";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect, Layer } from "effect";
import { formatOption, keysOption, orgOption, output } from "./shared";

dayjs.extend(localizedFormat);

const warehouseOption = Options.text("warehouse").pipe(Options.withDescription("The warehouse ID"));

const whCmd = Command.make("warehouse");

const warehouseCommand = whCmd.pipe(
  Command.withSubcommands([
    Command.make(
      "list",
      {
        org: orgOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/wh.list")(function* ({ format, keys, org }) {
        const repo = yield* WarehouseService;
        const warehouses = yield* repo.findByOrganizationId(org);
        return yield* output(warehouses, format, keys);
      }),
    ),
    Command.make(
      "list-all",
      {
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/wh.list-all")(function* ({ format, keys }) {
        const repo = yield* WarehouseService;
        const warehouses = yield* repo.all();
        return yield* output(warehouses, format, keys);
      }),
    ),
    Command.make(
      "show",
      {
        // org: orgOption,
        wh: warehouseOption,
        format: formatOption,
        keys: keysOption,
      },
      Effect.fn("@warehouse/cli/wh.show")(function* ({ wh, format, keys }) {
        const repo = yield* WarehouseService;
        const warehouse = yield* repo.findById(wh);
        return yield* output(warehouse, format, keys);
      }),
    ),
  ]),
);

export default warehouseCommand;
export const layers = Layer.mergeAll(WarehouseLive);
