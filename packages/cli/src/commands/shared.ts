import { Options } from "@effect/cli";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Cause, Console, Effect, Exit, Match, Schema } from "effect";

dayjs.extend(localizedFormat);

export const orgOption = Options.text("org").pipe(Options.withDescription("The org ID"));
const formatOptions = ["json", "text"] as const;
export const formatOption = Options.choice("format", formatOptions).pipe(
  Options.withDescription("The output format"),
  Options.withDefault("json"),
);

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
  Options.withSchema(stringToArraySchema),
  Options.withDefault([] as string[]),
);

export const output = <T extends unknown>(
  data: T,
  format: (typeof formatOptions)[number],
  keys?: readonly (keyof T | (string & {}))[],
) => {
  const _keys = keys ?? Object.keys(data);

  const _output =
    keys.length > 0
      ? Array.isArray(data)
        ? data.map((d) => Object.fromEntries(_keys.map((k) => [k, d[k]])))
        : Object.fromEntries(_keys.map((k) => [k, data[k]]))
      : data;
  return Match.value(format).pipe(
    Match.when(
      "json",
      Effect.fn(function* () {
        yield* Console.dir(_output, { depth: Infinity });
      }),
    ),
    Match.when(
      "text",
      Effect.fn(function* () {
        yield* Console.log(JSON.stringify(_output));
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
    ? data.map(transformDates)
    : Object.assign(data, {
        createdAt: dayjs(data.createdAt).format("LLL"),
        updatedAt: data.updatedAt ? dayjs(data.updatedAt).format("LLL") : null,
        deletedAt: data.deletedAt ? dayjs(data.deletedAt).format("LLL") : null,
      });
