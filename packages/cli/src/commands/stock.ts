import { Args, Command, Options } from "@effect/cli";
import { InventoryLive, InventoryService } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { PrinterLive, PrinterService } from "@warehouseoetzidev/printer/src/index";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect, Layer } from "effect";
import { formatOption, keysOption, orgOption, output, printOption } from "./shared";

dayjs.extend(localizedFormat);

const storageOption = Options.text("storage").pipe(Options.withDescription("The storage ID"));

const stockCommand = Command.make(
  "stock",
  { org: orgOption, format: formatOption, keys: keysOption, print: printOption },
  Effect.fn("@warehouse/cli/stock.show")(function* ({ org, format, keys, print }) {
    const repo = yield* InventoryService;
    const stats = yield* repo.statistics().pipe(Effect.provide(Layer.succeed(OrganizationId, org)));
    if (print) {
      const printer = yield* PrinterService;
      yield* printer.print(printer.usb(), {
        text: [
          {
            content: "Inventory Statistics",
            font: "a",
            align: "ct",
            style: "b",
            size: [2, 2],
          },
          {
            content: `Capacity: ${stats.capacity}`,
            font: "a",
            align: "ct",
            style: "b",
            size: [2, 2],
          },
          {
            content: `Storages: ${stats.storages.length}`,
            font: "a",
            align: "ct",
            style: "b",
            size: [2, 2],
          },
          // stats.storages.map((s) => ({
          //   content: `Storage: ${s.name}`,
          //   font: "a",
          //   align: "ct",
          //   style: "b",
          //   size: [2, 2],
          // })),
        ],
      });
    }
    return yield* output(stats, format, keys);
  }),
);

export default stockCommand;
export const layers = Layer.mergeAll(InventoryLive, PrinterLive);
