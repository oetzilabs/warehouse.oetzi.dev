import { BunRuntime } from "@effect/platform-bun";
import { Context, Effect, Layer } from "effect";

export class OrganizationId extends Context.Tag("OrganizationId")<OrganizationId, string>() {}
