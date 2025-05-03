import { Context, Effect, Layer } from "effect";

export interface VirtualFileSystemService {
  /**
   * Returns the base path of the virtual file system.
   */
  readonly basePath: string;

  /**
   * Creates a new folder.
   * @param folderPath The path of the folder to create.
   * @returns An Effect that resolves when the folder is created.
   */
  createFolder(folderPath: string): Effect.Effect<void, Error, never>;

  /**
   * Writes content to a file, creating a new version.
   * The latest version will be made accessible at the specified filePath.
   * @param filePath The path of the file.
   * @param content The content to write.
   * @returns An Effect that resolves when the content is written and versioned.
   */
  writeFile(filePath: string, content: string | Buffer): Effect.Effect<void, Error, never>;

  /**
   * Reads the content of the *latest* version of a file.
   * @param filePath The path of the file.
   * @returns An Effect that resolves to the file content.
   */
  readFile(filePath: string): Effect.Effect<Buffer, Error, never>;

  /**
   * Reads the content of a *specific* version of a file.
   * @param filePath The path of the file.
   * @param versionId The identifier for the version (e.g., timestamp, version number).
   * @returns An Effect that resolves to the file content.
   */
  readFileVersion(filePath: string, versionId: string): Effect.Effect<Buffer, Error, never>;

  /**
   * Deletes a file or an empty folder. For versioned files, this might archive or delete all versions.
   * @param itemPath The path of the file or folder to delete.
   * @returns An Effect that resolves when the item is deleted.
   */
  deleteItem(itemPath: string): Effect.Effect<void, Error, never>;

  /**
   * Deletes a specific version of a file.
   * @param filePath The path of the file.
   * @param versionId The identifier for the version to delete.
   * @returns An Effect that resolves when the version is deleted.
   */
  deleteFileVersion(filePath: string, versionId: string): Effect.Effect<void, Error, never>;

  /**
   * Lists the contents of a folder, showing the latest version of files.
   * @param folderPath The path of the folder.
   * @returns An Effect that resolves to an array of item names (files and folders) within the folder.
   */
  listFolderContents(folderPath: string): Effect.Effect<Array<string>, Error, never>;

  /**
   * Lists the available versions of a file.
   * @param filePath The path of the file.
   * @returns An Effect that resolves to an array of version identifiers.
   */
  listFileVersions(filePath: string): Effect.Effect<Array<string>, Error, never>;

  /**
   * Checks if an item (file or folder) exists at the given path (checking the latest version for files).
   * @param itemPath The path of the item.
   * @returns An Effect that resolves to a boolean indicating existence.
   */
  itemExists(itemPath: string): Effect.Effect<boolean, Error, never>;

  /**
   * Gets information about an item (file or folder), showing info for the latest version of files.
   * @param itemPath The path of the item.
   * @returns An Effect that resolves to item information or null if not found.
   */
  getItemInfo(itemPath: string): Effect.Effect<VirtualFileSystemItemInfo | null, Error, never>;

  /**
   * Gets information about a *specific* version of a file.
   * @param filePath The path of the file.
   * @param versionId The identifier for the version.
   * @returns An Effect that resolves to item information or null if the version is not found.
   */
  getItemVersionInfo(
    filePath: string,
    versionId: string,
  ): Effect.Effect<VirtualFileSystemItemInfo | null, Error, never>;
}

export interface VirtualFileSystemItemInfo {
  name: string;
  type: "file" | "folder" | "unknown";
  size?: number;
  versionId?: string; // Add version identifier to info
  createdAt?: Date; // Useful for versioning
  // Add other relevant information like modification time
}

export const VirtualFileSystemService = Effect.Service<VirtualFileSystemService>();

export class BasePath extends Context.Tag<"@warehouse/vfs/base-path">("@warehouse/vfs/base-path")<BasePath, string>() {}

export const makeBasePathLayer = (basePath: string) => Layer.effect(BasePath, Effect.succeed(basePath));
