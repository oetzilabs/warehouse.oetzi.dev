import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Context, Effect, Layer } from "effect";
import { BasePath, VirtualFileSystemItemInfo, VirtualFileSystemServiceInterface } from "./";

interface S3ConfigInterface {
  bucket: string;
  client: S3Client;
}

export class S3Config extends Context.Tag<"@warehouse/vfs/s3/config">("@warehouse/vfs/s3/config")<
  S3Config,
  S3ConfigInterface
>() {}

export class S3DocumentStorageService extends Effect.Service<VirtualFileSystemServiceInterface>()("@warehouse/vfs/s3", {
  effect: Effect.gen(function* (_) {
    const config = yield* _(S3Config);
    const basePath = yield* _(BasePath);

    const createFolder = (folderPath: string) =>
      Effect.tryPromise({
        try: async () => {
          await config.client.send(
            new PutObjectCommand({
              Bucket: config.bucket,
              Key: `${folderPath}/`,
              Body: "",
            }),
          );
        },
        catch: (e) => new Error(`Failed to create folder: ${e}`),
      });

    const writeFile = (filePath: string, content: string | Buffer) =>
      Effect.tryPromise({
        try: async () => {
          await config.client.send(
            new PutObjectCommand({
              Bucket: config.bucket,
              Key: filePath,
              Body: content,
            }),
          );
        },
        catch: (e) => new Error(`Failed to write file: ${e}`),
      });

    const readFile = (filePath: string) =>
      Effect.tryPromise({
        try: async () => {
          const response = await config.client.send(
            new GetObjectCommand({
              Bucket: config.bucket,
              Key: filePath,
            }),
          );
          const arrayBuffer = await response.Body?.transformToByteArray();
          if (!arrayBuffer) throw new Error("No content");
          return Buffer.from(arrayBuffer);
        },
        catch: (e) => new Error(`Failed to read file: ${e}`),
      });

    const readFileVersion = (filePath: string, versionId: string) =>
      Effect.tryPromise({
        try: async () => {
          const response = await config.client.send(
            new GetObjectCommand({
              Bucket: config.bucket,
              Key: filePath,
              VersionId: versionId,
            }),
          );
          const arrayBuffer = await response.Body?.transformToByteArray();
          if (!arrayBuffer) throw new Error("No content");
          return Buffer.from(arrayBuffer);
        },
        catch: (e) => new Error(`Failed to read file version: ${e}`),
      });

    const deleteItem = (itemPath: string) =>
      Effect.tryPromise({
        try: async () => {
          await config.client.send(
            new DeleteObjectCommand({
              Bucket: config.bucket,
              Key: itemPath,
            }),
          );
        },
        catch: (e) => new Error(`Failed to delete item: ${e}`),
      });

    const deleteFileVersion = (filePath: string, versionId: string) =>
      Effect.tryPromise({
        try: async () => {
          await config.client.send(
            new DeleteObjectCommand({
              Bucket: config.bucket,
              Key: filePath,
              VersionId: versionId,
            }),
          );
        },
        catch: (e) => new Error(`Failed to delete file version: ${e}`),
      });

    const listFolderContents = (folderPath: string) =>
      Effect.tryPromise({
        try: async () => {
          const response = await config.client.send(
            new ListObjectsV2Command({
              Bucket: config.bucket,
              Prefix: folderPath,
              Delimiter: "/",
            }),
          );
          const items = [
            ...(response.CommonPrefixes?.map((p) => p.Prefix?.slice(0, -1) ?? "") ?? []),
            ...(response.Contents?.map((c) => c.Key ?? "") ?? []),
          ];
          return items.filter(Boolean);
        },
        catch: (e) => new Error(`Failed to list folder contents: ${e}`),
      });

    const listFileVersions = (filePath: string) =>
      Effect.gen(function* (_) {
        // Use ListObjectVersionsCommand to get all versions
        const response = yield* Effect.promise(() =>
          config.client.send(
            new ListObjectVersionsCommand({
              Bucket: config.bucket,
              Prefix: filePath, // Use the file path as the prefix
            }),
          ),
        );

        // Extract VersionId from each Version and DeleteMarker
        const versions: string[] = [];
        if (response.Versions) {
          response.Versions.forEach((version) => {
            if (version.VersionId) {
              versions.push(version.VersionId);
            }
          });
        }
        if (response.DeleteMarkers) {
          response.DeleteMarkers.forEach((deleteMarker) => {
            if (deleteMarker.VersionId) {
              versions.push(deleteMarker.VersionId);
            }
          });
        }

        return versions;
      });

    const itemExists = (itemPath: string) =>
      Effect.tryPromise({
        try: async () => {
          try {
            await config.client.send(
              new HeadObjectCommand({
                Bucket: config.bucket,
                Key: itemPath,
              }),
            );
            return true;
          } catch {
            return false;
          }
        },
        catch: () => false,
      });

    const getItemInfo = (itemPath: string) =>
      Effect.tryPromise({
        try: async () => {
          try {
            const response = await config.client.send(
              new HeadObjectCommand({
                Bucket: config.bucket,
                Key: itemPath,
              }),
            );
            return {
              name: itemPath.split("/").pop() ?? "",
              type: itemPath.endsWith("/") ? "folder" : "file",
              size: response.ContentLength,
              versionId: response.VersionId,
              createdAt: response.LastModified,
            } as VirtualFileSystemItemInfo;
          } catch {
            return null;
          }
        },
        catch: (e) => new Error(`Failed to get item info: ${e}`),
      });

    const getItemVersionInfo = (filePath: string, versionId: string) =>
      Effect.tryPromise({
        try: async () => {
          try {
            const response = await config.client.send(
              new HeadObjectCommand({
                Bucket: config.bucket,
                Key: filePath,
                VersionId: versionId,
              }),
            );
            return {
              name: filePath.split("/").pop() ?? "",
              type: "file",
              size: response.ContentLength,
              versionId: response.VersionId,
              createdAt: response.LastModified,
            } as VirtualFileSystemItemInfo;
          } catch {
            return null;
          }
        },
        catch: (e) => new Error(`Failed to get item version info: ${e}`),
      });

    return {
      basePath,
      createFolder,
      writeFile,
      readFile,
      readFileVersion,
      deleteItem,
      deleteFileVersion,
      listFolderContents,
      listFileVersions,
      itemExists,
      getItemInfo,
      getItemVersionInfo,
    } as const;
  }),
}) {}

export const S3DocumentStorageLive = S3DocumentStorageService.Default;

export const makeS3ConfigLayer = (config: S3ConfigInterface) => Layer.succeed(S3Config, config);

export const makeS3BasePathLayer = (basePath: string) => Layer.succeed(BasePath, basePath);

export const makeS3Service = (config: S3ConfigInterface, basePath: string) =>
  Layer.merge(makeS3ConfigLayer(config), makeS3BasePathLayer(basePath));
