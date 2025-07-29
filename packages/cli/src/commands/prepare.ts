import { Command, Options } from "@effect/cli";
import { FileSystem, Path } from "@effect/platform";
import { DownloaderService } from "@warehouseoetzidev/core/src/entities/downloader";
import { Console, Effect, Layer, Option } from "effect";
import { output, unzipFile } from "./shared"; // Assuming unzipFile and output are here

const outdirOption = Options.text("outdir").pipe(
  Options.withDescription("The base output directory for the prepared files (relative to root, or absolute)"),
  Options.withDefault(""),
);

const rootOption = Options.text("root").pipe(
  Options.withDescription("The workspace root directory (defaults to current working directory)"),
  Options.optional,
);

const overrideOption = Options.boolean("override", { ifPresent: true }).pipe(
  Options.withDescription("If present, clears the output directory if it's not empty."),
  Options.withAlias("o"),
  Options.optional,
);

export const prepareCommand = Command.make(
  "prepare",
  {
    outdir: outdirOption,
    root: rootOption,
    override: overrideOption, // Add the override option
  },
  Effect.fn("@warehouse/cli/prepare")(function* ({ outdir, root, override }) {
    const ghostscript_layer_url =
      "https://github.com/cbschuld/ghostscript-aws-lambda-layer/releases/download/10.02.1/ghostscript-layer.zip";
    const imagemagick_layer_url =
      "https://github.com/cbschuld/imagemagick-aws-lambda-layer/releases/download/7.1.1-21/imagemagick-layer.zip";

    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const downloader = yield* DownloaderService;

    // Determine the effective root directory
    const effectiveRoot = Option.getOrElse(root, () => process.cwd());
    yield* Console.log(`Using effective root directory: ${effectiveRoot}`);

    let finalBaseOutDir: string; // This will be 'packages' or your custom outdir
    if (path.isAbsolute(outdir)) {
      finalBaseOutDir = outdir;
      yield* Console.log(`Base output directory '${finalBaseOutDir}' is an absolute path.`);
    } else {
      finalBaseOutDir = path.join(effectiveRoot, outdir);
      yield* Console.log(`Base output directory '${outdir}' resolved relative to root: ${finalBaseOutDir}`);
    }

    // Define the full vendor directory path
    const vendorDir = path.join(finalBaseOutDir, ".vendor");

    // --- Check and Handle Existing Vendor Directory ---
    yield* Console.log(`Checking output vendor directory: ${vendorDir}`);
    const vendorDirExists = yield* fs.exists(vendorDir);

    if (vendorDirExists) {
      const entries = yield* fs.readDirectory(vendorDir);
      if (entries.length > 0) {
        // Directory exists and is not empty
        if (Option.isSome(override)) {
          yield* Console.log(`Directory '${vendorDir}' is not empty. Clearing it due to --override flag.`);
          // Remove the directory entirely and then recreate it
          yield* fs.remove(vendorDir, { recursive: true });
          yield* fs.makeDirectory(vendorDir, { recursive: true });
        } else {
          // Directory not empty, and no --override flag
          return yield* Effect.fail(
            new Error(`Error: Directory '${vendorDir}' is not empty. Use --override to clear it and proceed.`),
          );
        }
      } else {
        yield* Console.log(`Directory '${vendorDir}' exists and is empty. Proceeding.`);
      }
    } else {
      // Directory does not exist, so create it
      yield* Console.log(`Directory '${vendorDir}' does not exist. Creating it.`);
      yield* fs.makeDirectory(vendorDir, { recursive: true });
    }

    const ghostLayerFn = Effect.fn("@warehouse/cli/prepare/downloadGhostscriptLayer")(function* () {
      // --- Ghostscript Layer ---
      // Paths are now relative to the new vendorDir
      const ghostscriptZipPath = path.join(vendorDir, "ghostscript-layer.zip");
      const ghostscriptLayerDir = path.join(vendorDir, "ghostscript-layer");

      yield* Console.log("Downloading Ghostscript layer...");
      yield* downloader.download(ghostscript_layer_url, vendorDir);
      yield* Console.log(`Ghostscript layer downloaded to ${ghostscriptZipPath}`);

      yield* Console.log(`Unzipping ${ghostscriptZipPath}...`);
      // Ensure the target directory for the unzipped content exists within vendor
      yield* fs.makeDirectory(ghostscriptLayerDir, { recursive: true });
      yield* unzipFile(ghostscriptZipPath, ghostscriptLayerDir, (current, total) =>
        Effect.gen(function* () {
          return yield* Console.log(`Unzip Progress: ${current}/${total} files`);
        }),
      );
      yield* Console.log("Ghostscript layer unzipped.");

      yield* Console.log(`Removing ${ghostscriptZipPath}...`);
      yield* fs.remove(ghostscriptZipPath);
      yield* Console.log("Ghostscript zip removed.");

      const ghostscriptBinPath = path.join(ghostscriptLayerDir, "bin");

      yield* fs.chmod(path.join(ghostscriptBinPath, "gs"), 0o755);
    });

    const imageMagickLayerFn = Effect.fn("@warehouse/cli/prepare/downloadImageMagickLayer")(function* () {
      // --- ImageMagick Layer ---
      // Paths are now relative to the new vendorDir
      const imagemagickZipPath = path.join(vendorDir, "imagemagick-layer.zip");
      const imagemagickLayerDir = path.join(vendorDir, "imagemagick-layer");

      yield* Console.log("Downloading ImageMagick layer...");
      yield* downloader.download(imagemagick_layer_url, vendorDir);
      yield* Console.log(`ImageMagick layer downloaded to ${imagemagickZipPath}`);

      yield* Console.log(`Unzipping ${imagemagickZipPath}...`);
      // Ensure the target directory for the unzipped content exists within vendor
      yield* fs.makeDirectory(imagemagickLayerDir, { recursive: true });
      yield* unzipFile(imagemagickZipPath, imagemagickLayerDir, (current, total) =>
        Effect.gen(function* () {
          return yield* Console.log(`Unzip Progress: ${current}/${total} files`);
        }),
      );
      yield* Console.log("ImageMagick layer unzipped.");

      yield* Console.log(`Removing ${imagemagickZipPath}...`);
      yield* fs.remove(imagemagickZipPath);
      yield* Console.log("ImageMagick zip removed.");

      yield* Console.log("Setting specific execute permissions for binaries...");
      const imagemagickBinPath = path.join(imagemagickLayerDir, "bin");
      yield* fs.chmod(path.join(imagemagickBinPath, "magick"), 0o755);
      yield* fs.chmod(path.join(imagemagickBinPath, "convert"), 0o755);
      yield* fs.chmod(path.join(imagemagickBinPath, "identify"), 0o755);
    });

    yield* Effect.all([ghostLayerFn(), imageMagickLayerFn()], { concurrency: 2 });

    yield* Console.log("Preparation complete!");
  }),
);
