import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { program } from "../program";

NodeRuntime.runMain(Effect.scoped(program));

export {};
