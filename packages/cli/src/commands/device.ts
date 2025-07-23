import { Args, Command, Options, Primitive, Prompt } from "@effect/cli";
import { device_status_enum_values } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { DeviceService } from "@warehouseoetzidev/core/src/entities/devices";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Cause, Console, Effect, Exit, Layer, Match, Option, Schema } from "effect";
import { formatOption, keysOption, orgOption, output } from "./shared";

dayjs.extend(localizedFormat);

const deviceOption = Options.text("device").pipe(Options.withDescription("The device ID"), Options.withAlias("d"));
const forceUnregisterOption = Options.boolean("force").pipe(
  Options.withDescription("Force unregister"),
  Options.withAlias("f"),
);
const yesOption = Options.boolean("yes").pipe(
  Options.withDescription("Skip confirmation prompt"),
  Options.withAlias("y"),
  Options.withDefault(true),
);

const includeOption = Options.choice("include", ["deleted"]).pipe(
  Options.withDescription("Include only devices with a given status"),
  Options.withAlias("i"),
  Options.optional,
);

const findByNameOption = Options.text("name").pipe(Options.withDescription("Find a device by name"), Options.optional);
const findByStatusOption = Options.text("status").pipe(
  Options.withDescription("Find a device by name"),
  Options.withSchema(Schema.Literal(...device_status_enum_values)),
  Options.optional,
);

const dvCmd = Command.make("device", { org: orgOption }, () => Effect.succeed(undefined));

export const devicesCommand = dvCmd.pipe(
  Command.withSubcommands([
    Command.make(
      "find",
      {
        name: findByNameOption,
        status: findByStatusOption,
        format: formatOption,
        keys: keysOption,
      },
      ({ name, status, format, keys }) =>
        Effect.flatMap(
          dvCmd,
          Effect.fn("@warehouse/cli/devices.find")(function* ({ org }) {
            const repo = yield* DeviceService;
            const n = Option.getOrUndefined(name);
            const s = Option.getOrUndefined(status);
            const devices = yield* repo.findBy({ name: n, status: s });
            return yield* output(devices, format, keys);
          }),
        ),
    ),
    Command.make(
      "last-created",
      {
        format: formatOption,
        keys: keysOption,
      },
      ({ format, keys }) =>
        Effect.flatMap(
          dvCmd,
          Effect.fn("@warehouse/cli/devices.latestCreated")(function* ({ org }) {
            const repo = yield* DeviceService;
            const lastCreated = yield* repo.lastCreated();
            if (!lastCreated) {
              return yield* Console.error("No devices found");
            }
            return yield* output(lastCreated, format, keys);
          }),
        ),
    ),
    Command.make(
      "last-updated",
      {
        format: formatOption,
        keys: keysOption,
      },
      ({ format, keys }) =>
        Effect.flatMap(
          dvCmd,
          Effect.fn("@warehouse/cli/devices.latestUpdated")(function* ({ org }) {
            const repo = yield* DeviceService;
            const lastUpdated = yield* repo.lastUpdated();
            if (!lastUpdated) {
              return yield* Console.error("No devices found");
            }
            return yield* output(lastUpdated, format, keys);
          }),
        ),
    ),
    Command.make(
      "list",
      {
        include: includeOption,
        format: formatOption,
        keys: keysOption,
      },
      ({ include, format, keys }) =>
        Effect.flatMap(
          dvCmd,
          Effect.fn("@warehouse/cli/devices.list")(function* ({ org }) {
            const repo = yield* DeviceService;
            const devices = yield* repo.allWithInclude(include);
            return yield* output(devices, format, keys);
          }),
        ),
    ),
    Command.make("show", { device: deviceOption, format: formatOption, keys: keysOption }, ({ device, format, keys }) =>
      Effect.flatMap(
        dvCmd,
        Effect.fn("@warehouse/cli/devices.show")(function* ({ org }) {
          const repo = yield* DeviceService;
          const _device = yield* repo
            .findById(device)
            .pipe(Effect.catchTag("DeviceNotFound", () => Effect.succeed(null)));
          if (!_device) {
            return yield* Exit.failCause(Cause.fail(`Device ${device} not found`));
          }
          return yield* output(_device, format, keys);
        }),
      ),
    ),
    Command.make(
      "register",
      {
        format: formatOption,
        keys: keysOption,
      },
      ({ format, keys }) =>
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
            return yield* output(device, format, keys);
          }),
        ),
    ),
    Command.make(
      "unregister",
      { device: deviceOption, force: forceUnregisterOption, yes: yesOption, keys: keysOption, format: formatOption },
      ({ device, force, yes, keys, format }) =>
        Effect.flatMap(
          dvCmd,
          Effect.fn("@warehouse/cli/devices.unregister")(function* ({ org }) {
            const repo = yield* DeviceService;
            const _device = yield* repo
              .findById(device)
              .pipe(Effect.catchTag("DeviceNotFound", () => Effect.succeed(null)));
            if (!_device) {
              return yield* Console.log(`Device ${device} not found`);
            }
            if (!yes) {
              const confirmed = yield* Prompt.confirm({
                message: `Are you sure you want to unregister device ${_device.id}?`,
              });
              if (!confirmed) {
                return yield* Console.log(`Unregistering device ${_device.id} cancelled`);
              }
            }
            if (!force) {
              const removed = yield* repo.safeRemove(_device.id);
              return yield* output(_device, format, keys);
            } else {
              const removed = yield* repo.remove(_device.id);
              return yield* output(_device, format, keys);
            }
          }),
        ),
    ),
  ]),
);
