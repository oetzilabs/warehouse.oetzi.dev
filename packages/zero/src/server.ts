import "dotenv/config";
import { AuthLive, AuthService } from "@warehouseoetzidev/core/src/entities/authentication";
// import { validateAndDecodeAuthData } from "../shared/auth";
// import { handleLogin } from "./login";
import { Effect } from "effect";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { handlePush } from "./push";
import { must } from "./utils";

export const app = new Hono().basePath("/api");

const secretKey = new TextEncoder().encode(must(process.env.ZERO_AUTH_SECRET, "required env var ZERO_AUTH_SECRET"));

// app.get("/login", (c) => handleLogin(c, secretKey));
app.post(
  "/push",
  validator("cookie", (v) => {
    const auth = v["session_token"];
    if (!auth) {
      return undefined;
    }

    return Effect.runPromise(
      Effect.gen(function* () {
        const authService = yield* AuthService;
        const authData = yield* authService.verify(auth);
        return authData;
      }).pipe(Effect.provide([AuthLive])),
    );
  }),
  async (c) => {
    return await c.json(await handlePush(c.req.valid("cookie"), c.req.raw));
  },
);

export default app;
