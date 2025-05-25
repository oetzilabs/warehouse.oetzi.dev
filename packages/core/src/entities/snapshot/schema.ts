import dayjs from "dayjs";
import { date, InferInput, InferOutput, literal, object, pipe, string, transform, variant } from "valibot";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { SeedDataSchema } from "../seed/schema";

export const SnapshotInputSchema = variant("type", [
  object({
    type: literal("json"),
    id: prefixed_cuid2,
    createdAt: pipe(
      string(),
      transform((input) => dayjs(input).toDate()),
    ),
    data: SeedDataSchema,
  }),
  object({
    id: prefixed_cuid2,
    createdAt: pipe(
      date(),
      transform((input) => dayjs(input).toDate()),
    ),
    type: literal("sql"),
    data: string(),
  }),
]);

export const SnapshotOutputSchema = variant("type", [
  object({
    type: literal("json"),
    id: prefixed_cuid2,
    createdAt: pipe(
      string(),
      transform((input) => dayjs(input).unix().toString()),
    ),
    data: SeedDataSchema,
  }),
  object({
    id: prefixed_cuid2,
    createdAt: pipe(
      date(),
      transform((input) => dayjs(input).unix().toString()),
    ),
    type: literal("sql"),
    data: string(),
  }),
]);

export type SnapshotDataOutput = InferOutput<typeof SnapshotOutputSchema>;
export type SnapshotDataInput = InferInput<typeof SnapshotInputSchema>;
