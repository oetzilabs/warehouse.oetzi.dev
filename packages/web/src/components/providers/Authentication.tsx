import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";
// import { setCookie, getCookie } from "vinxi/http";
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  image: z.string(),
  email: z.string(),
});

export const [authLoggedin, setAuthLoggedin] = createSignal<boolean>(false);

export const [auth, setAuth] = createSignal<z.infer<typeof UserSchema> | null>(null);
