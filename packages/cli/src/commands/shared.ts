import { Options } from "@effect/cli";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Cause, Console, Effect, Exit, Match } from "effect";

dayjs.extend(localizedFormat);

export const orgOption = Options.text("org").pipe(Options.withDescription("The org ID"));
const formatOptions = ["json", "text"] as const;
export const formatOption = Options.choice("format", formatOptions).pipe(
  Options.withDescription("The output format"),
  Options.withDefault("json"),
);

export const output = <T extends unknown>(data: T, format: (typeof formatOptions)[number]) =>
  Match.value(format).pipe(
    Match.when(
      "json",
      Effect.fn(function* () {
        yield* Console.dir(data, { depth: Infinity });
      }),
    ),
    Match.when(
      "text",
      Effect.fn(function* () {
        yield* Console.log(JSON.stringify(data));
      }),
    ),
    Match.orElse(
      Effect.fn(function* () {
        return yield* Exit.failCause(Cause.fail(`Invalid format ${format}`));
      }),
    ),
  );

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
