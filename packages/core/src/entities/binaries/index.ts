import { FileSystem, Path } from "@effect/platform";
import { BunFileSystem, BunPath } from "@effect/platform-bun";
import { Array, Effect } from "effect";
import { WarehouseConfig, WarehouseConfigLive } from "../config";
import { BinaryError, BinaryFileNotFound } from "./errors";

type BinaryVersionCollection = Record<string, `${string}warehouse-${string}.tar.gz`>;

export class BinaryService extends Effect.Service<BinaryService>()("@warehouse/binaries", {
  effect: Effect.gen(function* (_) {
    const whConfig = yield* WarehouseConfig;
    const { IsLocal, BinaryDownloadBaseUrl, DefaultBinaryTargetFolderPath } = yield* whConfig.getConfig;
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const listVersions = Effect.fn("@warehouse/downloader/download")(function* () {
      const localVersions = yield* localExistingBinaries();
      return yield* Effect.succeed({
        remote: {
          latest: `${BinaryDownloadBaseUrl}/latest/warehouse-latest.tar.gz`,
        } as BinaryVersionCollection,
        local: localVersions,
      });
    });

    const localExistingBinaries = Effect.fn("@warehouse/downloader/localExistingBinaries")(function* (
      targetFolderPath = DefaultBinaryTargetFolderPath,
    ) {
      const p = path.resolve(targetFolderPath);
      const files = yield* fs.readDirectory(p);
      const binaryFiles = Array.fromIterable(files).filter((f) => f.endsWith(".tar.gz"));
      // create an object with the binary files
      const binaryFilesObject = binaryFiles.reduce((acc, file) => {
        const version = file.match(/warehouse-(.*)\.tar\.gz/)?.[1];
        if (!version) {
          return acc;
        }
        acc[version] = file as BinaryVersionCollection[keyof BinaryVersionCollection];
        return acc;
      }, {} as BinaryVersionCollection);
      return binaryFilesObject;
    });

    return {
      listVersions,
      localExistingBinaries,
    } as const;
  }),
  dependencies: [WarehouseConfigLive, BunFileSystem.layer, BunPath.layer],
}) {}

export const BinaryLive = BinaryService.Default;

// Type exports
export type Frontend = NonNullable<Awaited<ReturnType<BinaryService["localExistingBinaries"]>>>;
