import { HttpApiBuilder } from "@effect/platform";
import { Effect, Layer } from "effect";
import { WarehouseApi } from "../api";

export const OrganizationsGroupLive = HttpApiBuilder.group(WarehouseApi, "organizations", (handlers) =>
  Effect.gen(function* () {
    return handlers.handle(
      "list",
      Effect.fn(function* () {
        // TODO: Implement organizations list retrieval
        return [];
      }),
    );
  }),
);
