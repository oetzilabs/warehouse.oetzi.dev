import { Args, Command, Options } from "@effect/cli";
import { BinaryService } from "@warehouseoetzidev/core/src/entities/binaries";
import { DownloaderService } from "@warehouseoetzidev/core/src/entities/downloader";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Cause, Console, Effect, Exit, Layer, Option } from "effect";
import { formatOption, keysOption, orgOption, output } from "./shared";

dayjs.extend(localizedFormat);

const versionOption = Options.text("version").pipe(
  Options.withDescription("The version to update to"),
  Options.optional,
);

export const updateCommand = Command.make(
  "update",
  { version: versionOption },
  Effect.fn("@warehouse/cli/stock.show")(function* ({ version }) {
    const binaryService = yield* BinaryService;
    const listOfVersions = yield* binaryService.listVersions();
    const service = yield* DownloaderService;
    const v = version.pipe(Option.getOrElse(() => "latest"));
    const hasVersion = Object.hasOwn(listOfVersions.remote, v);
    const hasLocalVersion = Object.hasOwn(listOfVersions.local, v);
    if (!hasVersion && !hasLocalVersion) {
      return yield* Exit.failCause(Cause.fail(`Version ${v} not found`));
    } else if (hasLocalVersion) {
      const localVersion = listOfVersions.local[v];
      const localPath = path.join(DefaultBinaryTargetFolderPath, localVersion);
      yield* Console.log(`Using local version ${localVersion} at ${localPath}`);
      return;
    }
    const remoteVersionPath = listOfVersions.remote[v];
    yield* Console.log(`Downloading ${remoteVersionPath}`);
    const downloadedPath = yield* service
      .download(remoteVersionPath)
      .pipe(Effect.catchAllCause((cause) => Exit.failCause(cause)));
    yield* Console.log(`Downloaded ${downloadedPath}`);
    return;
  }),
);
