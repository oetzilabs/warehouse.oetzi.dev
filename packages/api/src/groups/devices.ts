import { HttpApiBuilder } from "@effect/platform";
import { Effect, Layer } from "effect";
import { Date } from "effect/Schema";
import { WarehouseApi } from "../api";

// Device handlers - implement your business logic here
export const DevicesGroupLive = HttpApiBuilder.group(WarehouseApi, "devices", (handlers) =>
  handlers
    .handle(
      "getTypes",
      Effect.fn(function* () {
        return [
          {
            id: "",
            name: "",
            description: "",
          },
        ];
      }),
    )
    .handle("setup", ({ payload }) =>
      // TODO: Implement device setup logic
      Effect.die("Not implemented"),
    )
    .handle("connect", ({ payload }) =>
      // TODO: Implement device connection logic
      Effect.die("Not implemented"),
    ),
);
