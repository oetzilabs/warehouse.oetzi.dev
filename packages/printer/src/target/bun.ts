import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { program } from "../program-2";

NodeRuntime.runMain(Effect.scoped(program));

export {};
