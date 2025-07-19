#!/usr/bin/env bun
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { OrganizationLive } from "@warehouseoetzidev/core/src/entities/organizations";
import { Effect, Layer } from "effect";
import { cli } from "./commands";

cli(process.argv).pipe(Effect.provide([OrganizationLive, BunContext.layer]), BunRuntime.runMain);
