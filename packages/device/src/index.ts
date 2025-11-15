import { Prompt } from "@effect/cli";
import { FetchHttpClient, FileSystem, HttpBody, HttpClient, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { DownloaderLive, DownloaderService } from "@warehouseoetzidev/core/src/entities/downloader";
import { Config, Effect, Pretty, Schema } from "effect";
import { DeviceBannedError, DeviceCapabilitiesNotFound, DeviceConfigNotFound } from "./errors";
import { DeviceCapability, DeviceConfig, DeviceConfigSchema } from "./schemas";

export class DeviceService extends Effect.Service<DeviceService>()("@warehouse/device", {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const HOME = yield* Config.string("HOME");
    const XDG_CONFIG_HOME = yield* Config.string("XDG_CONFIG_HOME").pipe(
      Config.withDefault(path.join(HOME, ".config")),
    );
    const CONFIG_HOME_ABSOLUTE = path.normalize(XDG_CONFIG_HOME);
    const CONFIG_DIR = yield* Config.string("CONFIG_DIR").pipe(
      Config.withDefault(`${CONFIG_HOME_ABSOLUTE}/warehouse/devices`),
    );
    const API_URL = yield* Config.string("API_URL").pipe(Config.withDefault("https://api.warehouse.oetzi.dev/v1"));
    const parser = Schema.decodeUnknown(DeviceConfigSchema);
    const encoder = Pretty.make(DeviceConfigSchema);
    const httpClient = yield* HttpClient.HttpClient;

    // create config directory if it doesn't exist
    const configDirExists = yield* fs.exists(CONFIG_DIR);
    if (!configDirExists) {
      yield* fs.makeDirectory(CONFIG_DIR, { recursive: true });
    }

    const getConfig = Effect.fn("@warehouse/device/getConfig")(function* (id: string) {
      const configPath = path.join(CONFIG_DIR, id, "config.json");
      const configExists = yield* fs.exists(configPath);
      if (!configExists) {
        return yield* Effect.fail(new DeviceConfigNotFound({ message: `Device config not found for ${id}` }));
      }

      const config = yield* fs.readFileString(configPath, "utf-8");

      return yield* parser(config);
    });

    const writeConfig = Effect.fn("@warehouse/device/writeConfig")(function* (id: string, config: DeviceConfig) {
      const configPath = path.join(CONFIG_DIR, id, "config.json");

      const configString = encoder(config);

      yield* fs.writeFileString(configPath, configString);
    });

    const setup = Effect.fn("@warehouse/device/setup")(function* (id: string) {
      // 1. Requerst device ID
      // 2. Generate token
      // 3. Write config
      // 4. Return config

      const deviceTypesResponse = yield* httpClient.get(`${API_URL}/device/types`, {
        acceptJson: true,
      });

      const orgsResponse = yield* httpClient.get(`${API_URL}/organizations/list`, {
        acceptJson: true,
      });
      const orgs = yield* Schema.decodeUnknown(
        Schema.Array(
          Schema.Struct({
            id: Schema.String,
            name: Schema.String,
          }),
        ),
      )(yield* orgsResponse.json);

      const orgId = yield* Prompt.select({
        message: "Choose an organization",
        choices: orgs.map((o) => ({
          title: o.name,
          value: o.id,
        })),
      });

      const deviceTypes = yield* Schema.decodeUnknown(
        Schema.Array(
          Schema.Struct({
            id: Schema.String,
            name: Schema.String,
            description: Schema.optional(Schema.String),
            deletedAt: Schema.optional(Schema.Date),
          }),
        ),
      )(yield* deviceTypesResponse.json);

      const chosenType = yield* Prompt.select({
        message: "Choose a device type",
        choices: deviceTypes.map((t) => ({
          title: t.name,
          value: t.id,
          description: t.description ?? "No description provided",
          disabled: t.deletedAt !== null,
        })),
      });

      const name = yield* Prompt.text({
        message: "Enter the name of the device: ",
        validate: (value) => (value.length === 0 ? Effect.fail("Device name cannot be empty") : Effect.succeed(value)),
      });

      const setupResponse = yield* httpClient.post(`${API_URL}/device/setup`, {
        acceptJson: true,
        body: yield* HttpBody.json({
          type: chosenType,
          name,
          orgId,
          deviceId: id,
        }),
      });

      const device = yield* Schema.decodeUnknown(DeviceConfigSchema)(yield* setupResponse.json);

      yield* writeConfig(device.deviceId, device);

      return device;
    });

    const connect = Effect.fn("@warehouse/device/connect")(function* (id: string) {
      const config = yield* getConfig(id).pipe(Effect.catchTag("DeviceConfigNotFound", () => setup(id)));
      // check if device is banned via request

      const connectResponse = yield* httpClient.post(`${API_URL}/device/connect`, {
        acceptJson: true,
        body: yield* HttpBody.json({
          deviceId: config.deviceId,
          token: config.token,
        }),
      });

      const remoteDeviceStatusResponse = yield* Schema.decodeUnknown(
        Schema.Struct(
          {
            status: Schema.Literal("banned", "ok", "unknown"),
          },
          {
            key: Schema.String,
            value: Schema.Any,
          },
        ),
      )(yield* connectResponse.json);

      if (remoteDeviceStatusResponse.status === "banned") {
        return yield* Effect.fail(
          new DeviceBannedError({ deviceId: config.deviceId, message: "Device is banned", token: config.token }),
        );
      }

      // TODO: If status is "unknown" send a post-request to the api to reset the device status.
      if (remoteDeviceStatusResponse.status === "unknown") {
      }

      return config;
    });

    const listOfDevices = Effect.fn("@warehouse/device/listOfDevices")(function* () {
      const devicesPath = CONFIG_DIR;
      const devicesFolders = yield* fs.readDirectory(devicesPath);
      const devices = [];
      for (const deviceFolder of devicesFolders) {
        const deviceConfigPath = path.join(devicesPath, deviceFolder, "config.json");
        const deviceConfig = yield* fs.readFileString(deviceConfigPath, "utf-8");
        const deviceConfigObject = yield* Schema.decodeUnknown(DeviceConfigSchema)(deviceConfig);
        devices.push(deviceConfigObject);
      }
      return devices;
    });

    const capabilities = Effect.fn("@warehouse/device/capabilities")(function* (deviceId: string) {
      const deviceConfig = yield* getConfig(deviceId);
      if (!deviceConfig) return yield* Effect.fail(new DeviceCapabilitiesNotFound({ message: "Device not found" }));
      return yield* Effect.all(
        deviceConfig.capabilities.map(
          Effect.fnUntraced(function* (cap) {
            const fileTargetPath = path.join(CONFIG_DIR, deviceId, "capabilities", `${cap}.cap.json`);
            const fileExists = yield* fs.exists(fileTargetPath);
            if (!fileExists) return yield* Effect.fail(new DeviceCapabilitiesNotFound({ message: "File not found" }));
            const fileContent = yield* fs.readFileString(fileTargetPath, "utf-8");
            const capJson = yield* Schema.decodeUnknown(DeviceCapability)(fileContent);
            return capJson.type;
          }),
        ),
      );
    });

    const updateCapabilities = Effect.fn("@warehouse/device/updateCapabilities")(
      function* (deviceId: string, capabilities: DeviceCapability[]) {
        const deviceConfig = yield* getConfig(deviceId);
        if (!deviceConfig) return yield* Effect.fail(new DeviceCapabilitiesNotFound({ message: "Device not found" }));
        const capabilityFilePath = path.join(CONFIG_DIR, deviceId, "capabilities");
        const capabilityFileExists = yield* fs.exists(capabilityFilePath);
        if (!capabilityFileExists) {
          yield* fs.makeDirectory(capabilityFilePath, { recursive: true });
        }
        const downloader = yield* DownloaderService;
        yield* Effect.all(
          capabilities.map(
            Effect.fnUntraced(function* (cap) {
              const fileTargetPath = path.join(capabilityFilePath, `${cap.version}.cap.json`);
              yield* fs.writeFileString(fileTargetPath, JSON.stringify(cap));
              const capFileFilename = path.join(capabilityFilePath, `${cap.version}.js`);
              const fileTargetPath2 = yield* downloader.download(cap.fileUrl, capFileFilename, "buffer").pipe(
                Effect.catchTags({
                  ResponseError: (e) => Effect.fail(new DeviceCapabilitiesNotFound({ message: e.message })),
                }),
              );
              deviceConfig.capabilities.push(cap.type);
              return fileTargetPath2;
            }),
          ),
          {
            concurrency: "unbounded",
          },
        );

        return deviceConfig;
      },
      (effect) => effect.pipe(Effect.provide([DownloaderLive])),
    );

    return { connect, setup, getConfig, listOfDevices, capabilities, updateCapabilities } as const;
  }),
  dependencies: [BunContext.layer, FetchHttpClient.layer],
}) {}

export const DeviceLive = DeviceService.Default;
