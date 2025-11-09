import { HttpApiBuilder } from "@effect/platform";
import { Console, Effect, Layer } from "effect";
import { WarehouseApi } from "../api";

// Device handlers - implement your business logic here
export const HomeGroupLive = HttpApiBuilder.group(WarehouseApi, "home", (handlers) =>
  handlers.handle(
    "index",
    Effect.fn(function* () {
      yield* Console.log("Hitting home endpoint");
      return "Hello World!";
    }),
  ),
);
