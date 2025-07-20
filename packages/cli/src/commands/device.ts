import { Args, Command } from "@effect/cli";
import { DeviceService } from "@warehouseoetzidev/core/src/entities/devices";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect } from "effect";
import { orgArg } from "./shared";

dayjs.extend(localizedFormat);

const dvArg = Args.text({ name: "device" }).pipe(Args.withDescription("The device ID"));

const dvCmd = Command.make("devices", { org: orgArg }, () => Effect.succeed(undefined));

export const devicesCommand = dvCmd.pipe(
  Command.withSubcommands([
    Command.make("list", {}, () =>
      Effect.flatMap(
        dvCmd,
        Effect.fn("@warehouse/cli/devices.list")(function* ({ org }) {
          const repo = yield* DeviceService;
          const devices = yield* repo.all();
          if (!devices) {
            console.log(`No devices found`);
          } else {
            yield* Console.log(`Devices for organizations '${org}':`);
            yield* Console.table(
              devices.map((device) => ({
                id: device.id,
                name: device.name,
                createdAt: dayjs(device.createdAt).format("LLL"),
              })),
              ["id", "name", "createdAt"],
            );
          }
        }),
      ),
    ),
    Command.make("show", { device: dvArg }, ({ device }) =>
      Effect.flatMap(
        dvCmd,
        Effect.fn("@warehouse/cli/devices.show")(function* ({ org }) {
          const repo = yield* DeviceService;
          const organization = yield* repo.findById(device);
          console.log(`Organization for org '${organization}':`);
          console.log(
            `  - ${organization.id}: name ${organization.name} | created at: ${dayjs(organization.createdAt).format("LLL")}`,
          );
        }),
      ),
    ),
  ]),
);
