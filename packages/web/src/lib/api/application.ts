import { action } from "@solidjs/router";

export const subscribe = action(async (email: string) => {
  "use server";
  return true;
});
