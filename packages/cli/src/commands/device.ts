import { Args, Command } from "@effect/cli";
import { DeviceService } from "@warehouseoetzidev/core/src/entities/devices";
import { OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect, Layer } from "effect";
import { command } from ".";
import { orgArg } from "./shared";

dayjs.extend(localizedFormat);

const deviceArg = Args.text({ name: "device" }).pipe(Args.withDescription("The device ID"));

const listDevices = Command.make("list").pipe(
  Command.withDescription("List all devices for a specific organization"),
  Command.withHandler(() =>
    Effect.flatMap(
      command,
      Effect.fn("@warehouse/cli/org/device.list")(function* ({ org }) {
        const repo = yield* DeviceService;
        const orgId = Layer.succeed(OrganizationId, org);
        const devices = yield* repo.findByOrganizationId().pipe(Effect.provide(orgId));
        yield* Console.table(
          devices.map((device) => ({
            id: device.id,
            name: device.name,
            createdAt: dayjs(device.createdAt).format("LLL"),
          })),
        );
      }),
    ),
  ),
);

const showDevice = Command.make("show", { device: deviceArg }).pipe(
  Command.withDescription("Show detailed info for a specific organization"),
  Command.withHandler(({ device }) =>
    Effect.flatMap(
      command,
      Effect.fn("@warehouse/cli/org/device.show")(function* ({ org }) {
        const repo = yield* DeviceService;
        const orgRepo = yield* OrganizationService;
        const orgExists = yield* orgRepo.findById(org);

        const orgId = Layer.succeed(OrganizationId, org);
        const _device = yield* repo.findById(device).pipe(Effect.provide(orgId));
        if (_device.organization_id !== org) {
          return yield* Effect.fail(new Error("Device not found for this organization"));
        }

        yield* Console.log(
          `${_device.id}: ${_device.name} | ${dayjs(_device.createdAt).format("LLL")} (${dayjs(_device.createdAt).unix()})`,
        );
      }),
    ),
  ),
);

const registerDevice = Command.make("register").pipe(
  Command.withDescription("Show detailed info for a specific organization"),
  Command.withHandler(() =>
    Effect.flatMap(
      command,
      Effect.fn("@warehouse/cli/org/device.register")(function* ({ org }) {
        const repo = yield* DeviceService;
        const orgRepo = yield* OrganizationService;
        const orgExists = yield* orgRepo.findById(org);
        const orgId = Layer.succeed(OrganizationId, org);
        return Console.log("Hello World");
      }),
    ),
  ),
);

export const deviceCommand = Command.make("device").pipe(
  Command.withSubcommands([listDevices, showDevice, registerDevice]),
);
