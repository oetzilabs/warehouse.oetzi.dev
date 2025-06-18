import { BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { program } from "./program";

const brokerUrl = process.env.BROKER_URL!;
const clientId = process.env.CLIENT_ID!;

BunRuntime.runMain(Effect.scoped(program(brokerUrl, clientId)));

export {};
