import { A, createAsync, useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import { getAuthenticatedSession } from "../lib/api/auth";
import { cn } from "../lib/utils";
import UserMenu from "./UserMenu";

export function Header() {
  const loc = useLocation();
  const authenticated = createAsync(() => getAuthenticatedSession());
  return (
    <header class="bg-neutral-50/[0.01] dark:bg-neutral-950/[0.01] backdrop-blur-md flex flex-col px-0  items-center justify-between fixed top-0 left-0 right-0 z-50">
      <div class="flex flex-row w-full items-center justify-between px-4 py-2">
        <div class="flex flex-row items-center justify-start w-max gap-8 ">
          <A href="/" class="flex flex-row gap-4 items-center justify-center flex-1 w-max font-black">
            WareHouse.
          </A>
          <div class="flex flex-row gap-4 items-center justify-start"></div>
        </div>
        <div class="w-max items-center justify-end flex flex-row gap-2">
          <Show when={authenticated()} keyed>
            {(s) => <UserMenu session={s} />}
          </Show>
        </div>
      </div>
    </header>
  );
}
