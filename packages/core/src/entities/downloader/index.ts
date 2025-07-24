import { FetchHttpClient, FileSystem, HttpClient, HttpClientRequest, Path } from "@effect/platform";
import { BunFileSystem, BunHttpPlatform, BunPath } from "@effect/platform-bun";
import { Array, Chunk, Console, Effect, Stream } from "effect";
import { DownloaderError, DownloaderFileNotFound } from "./errors";

export class DownloaderService extends Effect.Service<DownloaderService>()("@warehouse/downloader", {
  effect: Effect.gen(function* (_) {
    const client = yield* HttpClient.HttpClient;
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const DEFAULT_TARGET_FOLDER_PATH = "/tmp";

    const download = Effect.fn("@warehouse/downloader/download")(function* (
      url: string,
      targetFolderPath = DEFAULT_TARGET_FOLDER_PATH,
    ) {
      const response = yield* client
        .get(url, {
          headers: {
            Accept: "application/octet-stream",
            responseType: "application/octet-stream",
          },
        })
        .pipe(
          Effect.catchTags({
            RequestError: (cause) => Effect.fail(new DownloaderError({ cause })),
            ResponseError: (cause) => Effect.fail(new DownloaderError({ cause })),
          }),
        );
      const isOk = response.status === 200;
      if (!isOk) {
        return yield* Effect.fail(new DownloaderError({ cause: new Error(`Response status is ${response.status}`) }));
      }
      yield* Console.log(`Response status is ${response.status}`);
      const stream = response.stream;
      const collection = yield* stream.pipe(Stream.runCollect);
      const dataArray = Chunk.toArray(collection);
      const data = Uint8Array.from(dataArray);
      const filename = path.basename(url);
      const targetPath = path.join(targetFolderPath, filename);
      yield* fs.writeFile(targetPath, data).pipe(
        Effect.catchTags({
          BadArgument: (cause) => Effect.fail(new DownloaderError({ cause })),
          SystemError: (cause) => Effect.fail(new DownloaderError({ cause })),
        }),
      );
      return yield* Effect.succeed(targetPath);
    });

    return {
      download,
    } as const;
  }),
  dependencies: [BunFileSystem.layer, BunPath.layer, FetchHttpClient.layer, BunHttpPlatform.layer],
}) {}

export const DownloaderLive = DownloaderService.Default;

// Type exports
// export type Frontend = NonNullable<Awaited<ReturnType<DownloaderService[""]>>>;
