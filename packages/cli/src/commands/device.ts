import { Args, Command, Options, Primitive, Prompt } from "@effect/cli";
import { device_status_enum_values } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { DeviceService } from "@warehouseoetzidev/core/src/entities/devices";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Console, Effect, Layer, Option, Schema } from "effect";
import { orgOption } from "./shared";

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

const findBy = Options.text("find").pipe(
  Options.withDescription("Find a device by name"),
  Options.optional,
  Options.withSchema(
    Schema.Struct({
      name: Schema.optional(Schema.String),
      status: Schema.optional(Schema.String),
      latestCreated: Schema.optional(Schema.Boolean),
      latestUpdated: Schema.optional(Schema.Boolean),
    }),
  ),
);

const findByNameOption = Args.text("name").pipe(Args.withDescription("Find a device by name"), Args.optional);
const findByStatusOption = Args.text("status").pipe(
  Args.withDescription("Find a device by name"),
  Args.withSchema(Schema.Literal(...device_status_enum_values)),
  Args.optional,
);

const dvCmd = Command.make("device", { org: orgOption }, () => Effect.succeed(undefined));

export const devicesCommand = dvCmd.pipe(
  Command.withSubcommands([
    Command.make("find").pipe(
      Command.withSubcommands([
        Command.make(
          "--name",
          {
            name: findByNameOption,
          },
          ({ name }) =>
            Effect.flatMap(
              dvCmd,
              Effect.fn("@warehouse/cli/devices.findByName")(function* ({ org }) {
                const repo = yield* DeviceService;
                const n = Option.getOrNull(name);
                if (!n) {
                  return yield* Console.error("No name provided");
                }
                const devices = yield* repo.findBy({ name: n });
                yield* Console.dir(devices, { depth: Infinity });
              }),
            ),
        ),
        Command.make(
          "--status",
          {
            status: findByStatusOption,
          },
          ({ status }) =>
            Effect.flatMap(
              dvCmd,
              Effect.fn("@warehouse/cli/devices.findByStatus")(function* ({ org }) {
                const repo = yield* DeviceService;
                const s = Option.getOrNull(status);
                if (!s) {
                  return yield* Console.error("No status provided");
                }
                const devices = yield* repo.findBy({ status: s });
                yield* Console.dir(devices, { depth: Infinity });
              }),
            ),
        ),
        Command.make("--latest-created", {}, ({}) =>
          Effect.flatMap(
            dvCmd,
            Effect.fn("@warehouse/cli/devices.findByLatestCreated")(function* ({ org }) {
              const repo = yield* DeviceService;
              const devices = yield* repo.all();
              const lastCreated = devices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
              if (!lastCreated) {
                return yield* Console.error("No devices found");
              }
              yield* Console.dir(lastCreated, { depth: Infinity });
            }),
          ),
        ),
        Command.make("--latest-updated", {}, ({}) =>
          Effect.flatMap(
            dvCmd,
            Effect.fn("@warehouse/cli/devices.findByLatestUpdated")(function* ({ org }) {
              const repo = yield* DeviceService;
              const devices = yield* repo.all();
              const lastUpdated = devices
                .filter((device) => device.updatedAt !== null)
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
              if (!lastUpdated) {
                return yield* Console.error("No devices found");
              }
              yield* Console.dir(lastUpdated, { depth: Infinity });
            }),
          ),
        ),
      ]),
    ),
    Command.make(
      "list",
      {
        include: includeOption,
      },
      ({ include }) =>
        Effect.flatMap(
          dvCmd,
          Effect.fn("@warehouse/cli/devices.list")(function* ({ org }) {
            const repo = yield* DeviceService;
            const devices = yield* repo.allWithInclude(include);

            yield* Console.log(`Devices for organizations '${org}':`);
            yield* Console.table(
              devices.map((device) => ({
                id: device.id,
                name: device.name,
                status: device.status,
                type: device.type.name,
                createdAt: dayjs(device.createdAt).format("LLL"),
              })),
              ["id", "name", "status", "createdAt", "type"],
            );
          }),
        ),
    ),
    Command.make("show", { device: deviceOption }, ({ device }) =>
      Effect.flatMap(
        dvCmd,
        Effect.fn("@warehouse/cli/devices.show")(function* ({ org }) {
          const repo = yield* DeviceService;
          const _device = yield* repo
            .findById(device)
            .pipe(Effect.catchTag("DeviceNotFound", () => Effect.succeed(null)));
          if (!_device) {
            return yield* Console.log(`Device ${device} not found`);
          }
          yield* Console.dir(_device, { depth: Infinity });
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
    Command.make(
      "unregister",
      { device: deviceOption, force: forceUnregisterOption, yes: yesOption },
      ({ device, force, yes }) =>
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
              return yield* Console.log(`Device ${_device.id} unregistered`);
            } else {
              const removed = yield* repo.remove(_device.id);
              return yield* Console.log(`Device ${_device.id} unregistered`);
            }
          }),
        ),
    ),
  ]),
);
