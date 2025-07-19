import { Args } from "@effect/cli";

export const orgArg = Args.text({ name: "orgId" }).pipe(Args.withDescription("The org ID"));
