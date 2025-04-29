import { cuid2, custom, pipe, safeParse, string } from "valibot";

export const prefixed_cuid2 = custom<string>((val: unknown) => {
  if (typeof val !== "string") return false;
  const splitUnderscore = val.split("_");
  if (splitUnderscore.length === 0) return false;
  const lastString = splitUnderscore[splitUnderscore.length - 1];
  const c = pipe(string(), cuid2());
  return safeParse(c, lastString).success;
});
