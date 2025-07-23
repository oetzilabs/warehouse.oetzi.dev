import { Args, Command, Options } from "@effect/cli";
import { InventoryService } from "@warehouseoetzidev/core/src/entities/inventory";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect, Layer } from "effect";
import { formatOption, keysOption, orgOption, output } from "./shared";

dayjs.extend(localizedFormat);

const storageOption = Options.text("storage").pipe(Options.withDescription("The storage ID"));

const stockCmd = Command.make(
  "stock",
  { org: orgOption, format: formatOption, keys: keysOption },
  Effect.fn("@warehouse/cli/stock.show")(function* ({ org, format, keys }) {
    const repo = yield* InventoryService;
    const stats = yield* repo.statistics().pipe(Effect.provide(Layer.succeed(OrganizationId, org)));
    return yield* output(stats, format, keys);
  }),
);

export const stockCommand = stockCmd;
// .pipe(
// Command.withSubcommands([
// Command.make("show", { org: orgArg }, () => Effect.void),
// Command.make("show", { stock: storageOption }, ({ wh }) =>
//   Effect.flatMap(
//     stockCmd,
//     Effect.fn("@warehouse/cli/wh.show")(function* ({ org }) {
//       const repo = yield* InventoryService;
//       const organization = yield* repo.findById(wh);
//       console.log(`Organization for org '${organization}':`);
//       console.log(
//         `  - ${organization.id}: name ${organization.name} | created at: ${dayjs(organization.createdAt).format("LLL")}`,
//       );
//     }),
//   ),
// ),
// ]),
// );
