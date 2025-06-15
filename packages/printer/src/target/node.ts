import { BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { program } from "../program";

BunRuntime.runMain(Effect.scoped(program));

export {};
