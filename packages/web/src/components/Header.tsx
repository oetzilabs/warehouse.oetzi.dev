import { A, createAsync } from "@solidjs/router";
import { Show, Suspense } from "solid-js";
import { getAuthenticatedUser } from "../lib/api/auth";
import ModeToggle from "./ModeToogle";
import UserMenu from "./UserMenu";

export function Header() {
  const user = createAsync(() => getAuthenticatedUser(), { deferStream: true });
  return (
    <header class="bg-neutral-50/[0.01] dark:bg-neutral-950/[0.01] backdrop-blur-md flex flex-col px-0  items-center justify-between fixed top-0 left-0 right-0 z-50 border-b">
      <div class="flex flex-row w-full items-center justify-between px-4 py-2">
        <div class="flex flex-row items-center justify-start w-max gap-8 ">
          <A href="/" class="flex flex-row gap-4 items-center justify-center flex-1 w-max font-bold">
            WareHouse.
          </A>
          <div class="flex flex-row gap-4 items-center justify-start"></div>
        </div>
        <div class="w-max items-center justify-end flex flex-row gap-2">
          <ModeToggle />
          <Suspense fallback={<div>Loading...</div>}>
            <Show
              when={user()}
              fallback={
                <A
                  href={import.meta.env.VITE_AUTH_URL}
                  class="flex flex-row gap-2 items-center justify-center flex-1 w-max"
                >
                  <span class="text-sm">Login</span>
                </A>
              }
            >
              {(u) => <UserMenu user={u()} />}
            </Show>
          </Suspense>
        </div>
      </div>
    </header>
  );
}
