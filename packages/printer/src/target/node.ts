import { BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { program } from "../program-3";

BunRuntime.runMain(Effect.scoped(program));

export {};
