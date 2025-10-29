import { Args, Options, Prompt } from "@effect/cli";
import { FileSystem, Path } from "@effect/platform";
import { createZipReader } from "@holmlibs/unzip";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Cause, Console, Effect, Exit, Match, Schema } from "effect";

dayjs.extend(localizedFormat);

export const orgOption = Options.text("org").pipe(Options.withDescription("The org ID"));
const formatOptions = ["json", "text", "human"] as const;
export const formatOption = Options.choice("format", formatOptions).pipe(
  Options.withDescription("The output format"),
  Options.withDefault("json"),
);
export const printOption = Options.boolean("print").pipe(Options.withDescription("Print the output to a printer"));

function csvRowToArray(inputString: string): string[] {
  const result: string[] = [];
  // Regex to match either:
  // 1. A double-quoted string: "([^"]*)"
  // 2. A single-quoted string: '([^']*)'
  // 3. An unquoted string: ([^,]+)
  // The `\s*` before and after allows for whitespace around fields.
  // We explicitly look for a comma or end of string `(?:,|$)` to consume the delimiter.
  const fieldRegex = /\s*(?:("([^"]*)")|('([^']*)')|([^,'"\s][^,]*?))\s*(?:,|$)/g;

  let match: RegExpExecArray | null;
  while ((match = fieldRegex.exec(inputString)) !== null) {
    let value: string;
    if (match[2] !== undefined) {
      // Matched double-quoted string (e.g., "trust this")
      value = match[2];
    } else if (match[4] !== undefined) {
      // Matched single-quoted string (e.g., 'this is a key')
      value = match[4];
    } else if (match[5] !== undefined) {
      // Matched unquoted string (e.g., asdf, 123)
      value = match[5];
    } else {
      // This case should ideally not be hit with a well-formed string and regex
      value = "";
    }
    result.push(value.trim()); // Trim any remaining whitespace within the extracted value
  }

  return result;
}

const stringToArraySchema = Schema.transform(Schema.String, Schema.Array(Schema.String), {
  decode: (fromA, fromI) => csvRowToArray(fromA),
  encode: (fromA, fromI) => fromA.join(","),
});

type StringToArraySchema = typeof stringToArraySchema.Type;

export const keysOption = Options.text("keys").pipe(
  Options.withDescription("The keys to display"),
  Options.map((t) => csvRowToArray(t)),
  Options.withDefault([] as string[]),
);

const printNestedObject = (
  obj: unknown,
  indentationLevel: number = 0,
  displayOrder: string[] = [],
): Effect.Effect<void> =>
  Effect.gen(function* () {
    if (typeof obj !== "object" || obj === null) {
      return yield* Console.log(`${"  ".repeat(indentationLevel)}Value: ${obj === null ? "null" : obj?.toString()}`);
    }

    const indent = "  ".repeat(indentationLevel);
    const nextIndent = "  ".repeat(indentationLevel + 1);

    const keysToDisplay = displayOrder.length ? displayOrder.filter((key) => key in obj) : Object.keys(obj);

    return yield* Effect.all(
      keysToDisplay.map((key) =>
        Effect.gen(function* () {
          let value: unknown | undefined;
          if (Object.hasOwn(obj, key)) {
            value = obj[key as keyof typeof obj];
          }

          if (Array.isArray(value)) {
            yield* Console.log(`${indent}${key}: [`);
            return yield* Effect.all(
              value.map((element) =>
                Effect.gen(function* () {
                  if (typeof element === "object" && element !== null) {
                    yield* Console.log(`${nextIndent}- `);
                    return yield* Effect.suspend(() => printNestedObject(element, indentationLevel + 2));
                  } else {
                    return yield* Console.log(`${nextIndent}- ${element}`);
                  }
                }),
              ),
            );
            yield* Console.log(`${indent}]`);
          } else if (typeof value === "object" && value !== null) {
            yield* Console.log(`${indent}${key}: {`);
            yield* Effect.suspend(() => printNestedObject(value, indentationLevel + 1));
            return yield* Console.log(`${indent}}`);
          } else {
            return yield* Console.log(`${indent}${key}: ${value}`);
          }
        }),
      ),
    );
  });

export const output = <T extends unknown>(
  data: T,
  format: (typeof formatOptions)[number],
  keys?: readonly (keyof T | (string & {}))[],
) => {
  let _keys = keys;
  if (!_keys && data instanceof Object && !Array.isArray(data)) {
    _keys = Object.keys(data);
  }
  if (keys === undefined && Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
    _keys = Object.keys(data[0]);
  }
  if (!_keys) {
    return Effect.succeed(undefined);
  }

  const _output =
    _keys.length > 0
      ? Array.isArray(data)
        ? data.map((d) => Object.fromEntries(_keys.map((k) => [k, d[k]])))
        : Object.fromEntries(_keys.map((k) => [k, data[k as keyof typeof data]]))
      : data;
  return Match.value(format).pipe(
    Match.when(
      "json",
      Effect.fn(function* () {
        return yield* Console.dir(_output, { depth: Infinity });
      }),
    ),
    Match.when(
      "text",
      Effect.fn(function* () {
        return yield* Console.log(JSON.stringify(_output));
      }),
    ),
    Match.when(
      "human",
      Effect.fn(function* () {
        yield* Console.log("Output (experimental):");
        return yield* printNestedObject(_output);
      }),
    ),
    Match.orElse(
      Effect.fn(function* () {
        return yield* Exit.failCause(Cause.fail(`Invalid format ${format}`));
      }),
    ),
  );
};

type Dates = {
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  deletedAt?: Date | string | null;
};

export const transformDates = <T extends Dates | Dates[]>(data: T): T =>
  Array.isArray(data)
    ? // @ts-ignore
      data.map(transformDates)
    : Object.assign(data, {
        createdAt: dayjs(data.createdAt).format("LLL"),
        updatedAt: data.updatedAt ? dayjs(data.updatedAt).format("LLL") : null,
        deletedAt: data.deletedAt ? dayjs(data.deletedAt).format("LLL") : null,
      });

export const storeFile = (choice: "bucket" | "local", buffer: Buffer, override: boolean, location?: string) => {
  return Match.value(choice).pipe(
    Match.when(
      "bucket",
      Effect.fn("@warehouse/cli/shared/storeFile/location.bucket")(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        let loc = location;
        if (!loc) {
          loc = yield* Prompt.text({
            message: "[BUCKET] Where do you want to store the pdf?",
            validate: Effect.fn(function* (value) {
              const nonempty = value.length === 0;
              const isAbsolute = path.isAbsolute(value);
              const filepathParsed = path.parse(isAbsolute ? value : path.join(process.cwd(), value));
              const directory = filepathParsed.dir;
              const directoryExists = yield* fs.exists(directory).pipe(
                Effect.catchTags({
                  BadArgument: (cause) =>
                    Effect.fail("The directory of the filepath you wrote could not be checked if it exists"),
                  SystemError: (cause) =>
                    Effect.fail("The directory of the filepath you wrote could not be checked if it exists"),
                }),
              );
              const locationExist = yield* fs.exists(value).pipe(
                Effect.catchTags({
                  BadArgument: (cause) =>
                    Effect.fail("The location of the filepath you wrote could not be checked if it exists"),
                  SystemError: (cause) =>
                    Effect.fail("The location of the filepath you wrote could not be checked if it exists"),
                }),
              );
              if (nonempty) return yield* Effect.fail("Please provide a path");
              if (!directoryExists)
                return yield* Effect.fail("The directory of the filepath you wrote does not exist.");
              if (locationExist && !override)
                return yield* Effect.fail("This file already exists. To override please provide `--override`");
              return value;
            }),
          });
        }
        yield* fs.writeFile(loc, buffer);
        return yield* Effect.succeed(loc);
      }),
    ),
    Match.when(
      "local",
      Effect.fn("@warehouse/cli/shared/storeFile/location.local")(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        let loc = location;
        if (!loc) {
          loc = yield* Prompt.text({
            message: "[LOCAL] Where do you want to store the pdf?",
            validate: Effect.fn(function* (value) {
              const nonempty = value.length === 0;
              const isAbsolute = path.isAbsolute(value);
              const filepathParsed = path.parse(isAbsolute ? value : path.join(process.cwd(), value));
              const directory = filepathParsed.dir;
              const directoryExists = yield* fs.exists(directory).pipe(
                Effect.catchTags({
                  BadArgument: (cause) =>
                    Effect.fail("The directory of the filepath you wrote could not be checked if it exists"),
                  SystemError: (cause) =>
                    Effect.fail("The directory of the filepath you wrote could not be checked if it exists"),
                }),
              );
              const locationExist = yield* fs.exists(value).pipe(
                Effect.catchTags({
                  BadArgument: (cause) =>
                    Effect.fail("The location of the filepath you wrote could not be checked if it exists"),
                  SystemError: (cause) =>
                    Effect.fail("The location of the filepath you wrote could not be checked if it exists"),
                }),
              );
              if (nonempty) return yield* Effect.fail("Please provide a path");
              if (!directoryExists)
                return yield* Effect.fail("The directory of the filepath you wrote does not exist.");
              if (locationExist && !override)
                return yield* Effect.fail("This file already exists. To override please provide `--override`");
              return value;
            }),
          });
        }
        yield* fs.writeFile(loc, buffer);
        return yield* Effect.succeed(loc);
      }),
    ),
    Match.orElse(
      Effect.fn(function* () {
        return yield* Effect.failCause(Cause.fail(`Invalid choice ${choice}`));
      }),
    ),
  );
};

export const unzipFile = (
  zipFilePath: string,
  targetDir: string,
  onProgress?: (current: number, total: number) => Effect.Effect<void>,
) => {
  const reader = createZipReader(zipFilePath);
  return Effect.tryPromise({
    try: () => reader.extractAll(targetDir, (current, total) => onProgress?.(current, total).pipe(Effect.runPromise)),
    catch: (e) => new Error(`Failed to unzip ${zipFilePath} with @holmlibs/unzip: ${String(e)}`),
  });
};
