import { Options } from "@effect/cli";

export const orgOption = Options.text("org").pipe(Options.withDescription("The org ID"));
