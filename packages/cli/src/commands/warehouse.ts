import { Args, Command, Options } from "@effect/cli";
import { WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect } from "effect";
import { orgOption } from "./shared";

dayjs.extend(localizedFormat);

const warehouseOption = Options.text("warehouse").pipe(Options.withDescription("The warehouse ID"));

const whCmd = Command.make("warehouse", { org: orgOption }, () => Effect.succeed(undefined));

export const warehouseCommand = whCmd.pipe(
  Command.withSubcommands([
    Command.make("list", {}, () =>
      Effect.flatMap(
        whCmd,
        Effect.fn("@warehouse/cli/wh.list")(function* ({ org }) {
          const repo = yield* WarehouseService;
          const warehouses = yield* repo.findByOrganizationId(org);
          if (!warehouses) {
            console.log(`No warehouses found`);
          } else {
            yield* Console.log(`Warehouses for organizations '${org}':`);
            yield* Console.table(
              warehouses.map((warehouse) => ({
                id: warehouse.id,
                name: warehouse.name,
                createdAt: dayjs(warehouse.createdAt).format("LLL"),
              })),
              ["id", "name", "createdAt"],
            );
          }
        }),
      ),
    ),
    Command.make("show", { wh: warehouseOption }, ({ wh }) =>
      Effect.flatMap(
        whCmd,
        Effect.fn("@warehouse/cli/wh.show")(function* ({ org }) {
          const repo = yield* WarehouseService;
          const organization = yield* repo.findById(wh);
          console.log(`Organization for org '${organization}':`);
          console.log(
            `  - ${organization.id}: name ${organization.name} | created at: ${dayjs(organization.createdAt).format("LLL")}`,
          );
        }),
      ),
    ),
  ]),
);
