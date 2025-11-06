#!/usr/bin/env bun
import { Command, Options } from "@effect/cli";
import { FetchHttpClient } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect } from "effect";
import { DaemonLive, DaemonService } from "./daemon";
import { DeviceLive, DeviceService } from "./index";

const deviceIdOption = Options.text("device-id").pipe(
  Options.withDescription("Device ID to operate on"),
  Options.withAlias("d"),
);

const forceOption = Options.boolean("force").pipe(Options.withDescription("Force operation"), Options.withAlias("f"));

const setupCommand = Command.make(
  "setup",
  {
    "device-id": deviceIdOption,
  },
  Effect.fn("setupCommand")(function* ({ "device-id": deviceId }) {
    const deviceService = yield* DeviceService;
    const config = yield* deviceService.setup(deviceId);
    yield* Console.log(`Device setup completed for ${config.deviceId}`);
    yield* Console.log(`Broker URL: ${config.brokerUrl}`);
    yield* Console.log(`Topic: ${config.topic}`);
  }),
);

const statusCommand = Command.make(
  "status",
  {},
  Effect.fn("statusCommand")(function* () {
    const deviceService = yield* DeviceService;
    const daemonService = yield* DaemonService;

    const daemonStatus = yield* daemonService.getDaemonStatus();
    yield* Console.log(`\n=== Daemon Status ===`);
    if (daemonStatus.status === "running") {
      yield* Console.log(`Status: Running (PID: ${daemonStatus.pid})`);
    } else {
      yield* Console.log("Status: Not running");
    }

    const devices = yield* deviceService.listOfDevices();

    if (devices.length === 0) {
      yield* Console.log("\n=== Devices ===");
      yield* Console.log("No devices configured");
      return;
    }

    yield* Console.log("\n=== Devices ===");
    for (const device of devices) {
      yield* Console.log(`Device ID: ${device.deviceId}`);
      yield* Console.log(`  Broker URL: ${device.brokerUrl}`);
      yield* Console.log(`  Topic: ${device.topic}`);
      yield* Console.log(`  Created At: ${device.createdAt}`);
      yield* Console.log("");
    }
  }),
);

const testCommand = Command.make(
  "test",
  {
    "device-id": deviceIdOption,
  },
  Effect.fn("testCommand")(function* ({ "device-id": deviceId }) {
    const deviceService = yield* DeviceService;

    yield* Console.log(`Testing device: ${deviceId}`);

    const config = yield* deviceService.getConfig(deviceId);
    yield* Console.log(`✓ Device config found for ${deviceId}`);

    const connectedConfig = yield* deviceService.connect(deviceId);
    yield* Console.log(`✓ Device ${deviceId} connected successfully`);
    yield* Console.log(`  - Broker: ${connectedConfig.brokerUrl}`);
    yield* Console.log(`  - Topic: ${connectedConfig.topic}`);
    yield* Console.log(`  - Token valid: ✓`);
  }),
);

const daemonStartCommand = Command.make(
  "daemon-start",
  {
    force: Options.optional(forceOption),
  },
  Effect.fn("daemonStartCommand")(function* ({ force }) {
    const daemonService = yield* DaemonService;

    if (force) {
      const status = yield* daemonService.getDaemonStatus();
      if (status.status === "running") {
        yield* Console.log(`Stopping existing daemon (PID: ${status.pid})...`);
        yield* daemonService.stopDaemon();
      }
    }

    const daemon = yield* daemonService.startDaemon();
    yield* Console.log(`Device daemon started successfully with PID: ${daemon.pid}`);
  }),
);

const daemonStopCommand = Command.make(
  "daemon-stop",
  {},
  Effect.fn("daemonStopCommand")(function* () {
    const daemonService = yield* DaemonService;
    yield* daemonService.stopDaemon();
    yield* Console.log("Device daemon stopped successfully");
  }),
);

const daemonStatusCommand = Command.make(
  "daemon-status",
  {},
  Effect.fn("daemonStatusCommand")(function* () {
    const daemonService = yield* DaemonService;
    const status = yield* daemonService.getDaemonStatus();

    if (status.status === "running") {
      yield* Console.log(`Device daemon is running (PID: ${status.pid})`);
    } else {
      yield* Console.log("Device daemon is not running");
    }
  }),
);

const deviceCommand = Command.make("device", {}, () => Effect.succeed(undefined)).pipe(
  Command.withSubcommands([
    setupCommand,
    statusCommand,
    testCommand,
    daemonStartCommand,
    daemonStopCommand,
    daemonStatusCommand,
  ]),
);

const cli = Command.run(deviceCommand, {
  name: "wh",
  version: "1.0.0",
});

if (import.meta.path === Bun.main) {
  cli(Bun.argv).pipe(
    Effect.provide([DeviceLive, DaemonLive, BunContext.layer, FetchHttpClient.layer]),
    BunRuntime.runMain,
  );
}
