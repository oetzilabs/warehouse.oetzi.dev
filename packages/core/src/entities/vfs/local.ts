import { FileSystem, Path } from "@effect/platform";
import { BunFileSystem } from "@effect/platform-bun";
import { Effect } from "effect";
import { BasePath, VirtualFileSystemItemInfo, VirtualFileSystemService } from "./";

export class LocalStorageAdapter extends Effect.Service<VirtualFileSystemService>()("@warehouse/vfs/local", {
  effect: Effect.gen(function* (_) {
    const fs = yield* _(FileSystem.FileSystem);
    const path = yield* _(Path.Path);
    const basePath = yield* _(BasePath);

    const createFolder = (folderPath: string) => fs.makeDirectory(path.join(folderPath), { recursive: true });
    const writeFile = (filePath: string, content: Uint8Array) => fs.writeFile(filePath, content);
    const readFile = (filePath: string) => fs.readFile(filePath);
    const readFileVersion = (filePath: string, versionId: string) => fs.readFile(path.join(filePath, versionId));
    const deleteItem = (itemPath: string) => fs.remove(itemPath, { force: true });
    // const deleteFileVersion = (filePath: string, versionId: string) => fs.unlink(path.join(filePath, versionId));
    const listFolderContents = (folderPath: string) => fs.readDirectory(folderPath);
    const listFileVersions = (filePath: string) => fs.readDirectory(path.join(filePath, ".versions"));
    const itemExists = (itemPath: string) => fs.access(itemPath);
    const getItemInfo = (itemPath: string) => fs.stat(itemPath);
    const getItemVersionInfo = (filePath: string, versionId: string) =>
      fs.stat(path.join(filePath, versionId)).pipe(
        Effect.map((stats) => ({
          name: path.basename(filePath),
          type: "file",
          size: stats.size,
          versionId,
          createdAt: stats.birthtime,
        })),
      );

    return {
      basePath,
      createFolder,
      writeFile,
      readFile,
      readFileVersion,
      deleteItem,
      // deleteFileVersion,
      listFolderContents,
      listFileVersions,
      itemExists,
      getItemInfo,
      getItemVersionInfo,
    } as const;
  }),
  dependencies: [BunFileSystem.layer, Path.layer],
}) {}

export const LocalStorageLive = LocalStorageAdapter.Default;

// Type exports
export type Frontend = NonNullable<Awaited<ReturnType<LocalStorageAdapter["createFolder"]>>>;
