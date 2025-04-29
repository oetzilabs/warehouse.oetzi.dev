import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";
// import { setCookie, getCookie } from "vinxi/http";
import { InferInput, object, string } from "valibot";

export const UserSchema = object({
  id: string(),
  username: string(),
  image: string(),
  email: string(),
});

export const [authLoggedin, setAuthLoggedin] = createSignal<boolean>(false);

export const [auth, setAuth] = createSignal<InferInput<typeof UserSchema> | null>(null);
