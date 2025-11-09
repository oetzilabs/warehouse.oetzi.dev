import { HttpApiBuilder, HttpApiSwagger, HttpServer } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { WarehouseApiLive } from ".";

// Main server layer using Bun
const ServerLive = HttpApiBuilder.serve().pipe(
  HttpServer.withLogAddress,
  Layer.provide(HttpApiSwagger.layer({ path: "/docs" })),
  Layer.provide(WarehouseApiLive),
  Layer.provide(
    BunHttpServer.layer({
      port: 9000,
      hostname: "0.0.0.0",
    }),
  ),
);

BunRuntime.runMain(Layer.launch(ServerLive));
