import { Args, Command, Options, Primitive, Prompt } from "@effect/cli";
import { DeviceService } from "@warehouseoetzidev/core/src/entities/devices";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect, Layer } from "effect";
import { orgOption } from "./shared";

dayjs.extend(localizedFormat);

const deviceOption = Options.text("device").pipe(Options.withDescription("The device ID"));

const dvCmd = Command.make("device", { org: orgOption }, () => Effect.succeed(undefined));

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
                type: device.type.name,
                createdAt: dayjs(device.createdAt).format("LLL"),
              })),
              ["id", "name", "createdAt", "type"],
            );
          }
        }),
      ),
    ),
    Command.make("show", { device: deviceOption }, ({ device }) =>
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
    Command.make("register", {}, () =>
      Effect.flatMap(
        dvCmd,
        Effect.fn("@warehouse/cli/devices.register")(function* ({ org }) {
          const repo = yield* DeviceService;
          const types = yield* repo.getDeviceTypes();
          const chosenType = yield* Prompt.select({
            message: "Choose a device type",
            choices: types.map((t) => ({
              title: t.name,
              value: t.id,
              description: t.description ?? "No description provided",
              disabled: t.deletedAt !== null,
            })),
          });
          if (!chosenType) {
            return yield* Effect.fail(new Error("No device type selected"));
          }
          const nameInput = yield* Prompt.text({
            message: "Enter the name of the device: ",
            validate: (value) =>
              value.length === 0 ? Effect.fail("Device name cannot be empty") : Effect.succeed(value),
          });
          const descriptionInput = yield* Prompt.text({
            message: "Enter a description for the device: ",
          });

          const device = yield* repo
            .create({
              name: nameInput,
              type_id: chosenType,
              description: descriptionInput,
              status: "unknown",
            })
            .pipe(Effect.provide(Layer.succeed(OrganizationId, org)));

          yield* Console.log(`Device created: ${device.id}`);
        }),
      ),
    ),
  ]),
);
