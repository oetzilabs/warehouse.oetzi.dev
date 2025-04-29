import { cache } from "@solidjs/router";
import { Resource } from "sst";
import { z } from "zod";

export const getWithEmail = cache(async () => {
  "use server";
  const withEmail = Resource.WithEmail;

  return z.coerce.boolean().parse(withEmail);
}, "with-email");
