import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Config, Effect, Mailbox } from "effect";
import { DaemonAlreadyRunning, DaemonError, DaemonNotRunning } from "./errors";

export class DaemonService extends Effect.Service<DaemonService>()("@warehouse/daemon", {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const home = yield* Config.string("HOME");
    const xdgConfigHome = yield* Config.string("XDG_CONFIG_HOME").pipe(Config.withDefault(path.join(home, ".config")));

    const getPidFilePath = Effect.fn("@warehouse/daemon/getPidFilePath")(function* () {
      return path.join(xdgConfigHome, "warehouse", "device-daemon.pid");
    });

    const isDaemonRunning = Effect.fn("@warehouse/daemon/isDaemonRunning")(function* (pid: number) {
      return yield* Effect.tryPromise({
        try: () => Bun.spawn(["kill", "-0", pid.toString()]).exited,
        catch: () => false,
      });
    });

    const writePidFile = Effect.fn("@warehouse/daemon/writePidFile")(function* (pid: number) {
      const fs = yield* FileSystem.FileSystem;
      const pidFile = yield* getPidFilePath();
      const pidDir = pidFile.split("/").slice(0, -1).join("/");
      yield* fs.makeDirectory(pidDir, { recursive: true });
      yield* fs.writeFileString(pidFile, pid.toString());
    });

    const readPidFile = Effect.fn("@warehouse/daemon/readPidFile")(function* () {
      const fs = yield* FileSystem.FileSystem;
      const pidFile = yield* getPidFilePath();
      const exists = yield* fs.exists(pidFile);
      if (!exists) {
        return yield* Effect.fail(new DaemonNotRunning({ message: "PID file not found" }));
      }
      const content = yield* fs.readFileString(pidFile);
      const pid = parseInt(content.trim());
      if (isNaN(pid)) {
        return yield* Effect.fail(new DaemonNotRunning({ message: "Invalid PID in file" }));
      }
      return pid;
    });

    const removePidFile = Effect.fn("@warehouse/daemon/removePidFile")(function* () {
      const fs = yield* FileSystem.FileSystem;
      const pidFile = yield* getPidFilePath();
      const exists = yield* fs.exists(pidFile);
      if (exists) {
        yield* fs.remove(pidFile);
      }
    });

    const daemonLoop = Effect.fn("@warehouse/daemon/daemonLoop")(function* (mailbox: Mailbox.Mailbox<string, never>) {
      while (true) {
        const message = yield* mailbox.take;
        yield* Effect.log(`Daemon received message: ${message}`);

        if (message === "shutdown") {
          yield* Effect.log("Shutting down daemon");
          break;
        }
      }
    });

    const startDaemon = Effect.fn("@warehouse/daemon/startDaemon")(function* () {
      const currentPid = process.pid;

      const existingPid = yield* readPidFile().pipe(
        Effect.catchTag("DaemonNotRunning", () => Effect.succeed(undefined)),
      );

      if (existingPid) {
        const isRunning = yield* isDaemonRunning(existingPid);
        if (isRunning) {
          return yield* Effect.fail(new DaemonAlreadyRunning({ pid: existingPid }));
        } else {
          yield* removePidFile();
        }
      }

      yield* writePidFile(currentPid);

      const mailbox = yield* Mailbox.make<string>();
      const daemonFiber = yield* daemonLoop(mailbox).pipe(Effect.fork, Effect.scoped);

      yield* Effect.log(`Device daemon started with PID: ${currentPid}`);

      return {
        pid: currentPid,
        mailbox,
        fiber: daemonFiber,
      } as const;
    });

    const stopDaemon = Effect.fn("@warehouse/daemon/stopDaemon")(function* () {
      const pid = yield* readPidFile();
      const isRunning = yield* isDaemonRunning(pid);

      if (!isRunning) {
        yield* removePidFile();
        return yield* Effect.fail(new DaemonNotRunning({ message: "Daemon is not running" }));
      }

      yield* Effect.tryPromise({
        try: () => Bun.spawn(["kill", "-TERM", pid.toString()]).exited,
        catch: (error) => new DaemonError({ message: `Failed to stop daemon: ${error}` }),
      });

      yield* Effect.log(`Sent TERM signal to daemon PID: ${pid}`);

      yield* Effect.sleep(1000);
      const stillRunning = yield* isDaemonRunning(pid);
      if (stillRunning) {
        yield* Effect.tryPromise({
          try: () => Bun.spawn(["kill", "-KILL", pid.toString()]).exited,
          catch: (error) => new DaemonError({ message: `Failed to force kill daemon: ${error}` }),
        });
        yield* Effect.log(`Force killed daemon PID: ${pid}`);
      }

      yield* removePidFile();
      yield* Effect.log("Daemon stopped successfully");
    });

    const getDaemonStatus = Effect.fn("@warehouse/daemon/getDaemonStatus")(function* () {
      const pid = yield* readPidFile().pipe(Effect.catchTag("DaemonNotRunning", () => Effect.succeed(undefined)));

      if (!pid) {
        return { status: "not-running" as const };
      }

      const isRunning = yield* isDaemonRunning(pid);
      if (isRunning) {
        return { status: "running" as const, pid };
      } else {
        // yield* removePidFile();
        return { status: "not-running" as const };
      }
    });

    return { startDaemon, stopDaemon, getDaemonStatus } as const;
  }),
  dependencies: [BunContext.layer],
}) {}

export const DaemonLive = DaemonService.Default;
