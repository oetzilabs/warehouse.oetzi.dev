import { Args } from "@effect/cli";

export const orgArg = Args.text({ name: "org" }).pipe(Args.withDescription("The org ID"));
