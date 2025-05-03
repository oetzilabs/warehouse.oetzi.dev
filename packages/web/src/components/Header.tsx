import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { A, createAsync, useAction } from "@solidjs/router";
import LogIn from "lucide-solid/icons/log-in";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import ModeToggle from "./ModeToogle";
import { Button } from "./ui/button";
import UserMenu from "./UserMenu";

export function Header() {
  const user = createAsync(() => getAuthenticatedUser({ skipOnboarding: true }), { deferStream: true });
  const sessionToken = createAsync(() => getSessionToken(), { deferStream: true });
  return (
    <div class="flex flex-col p-2 w-full">
      <header class="bg-neutral-50/[0.01] dark:bg-neutral-950/[0.01] backdrop-blur-md flex flex-col px-0 items-center justify-between border border-neutral-200 dark:border-neutral-800 rounded-lg">
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
                  <Button as={A} href="/login" size="sm" class="w-max h-8">
                    Login
                    <LogIn class="size-4" />
                  </Button>
                }
              >
                {(u) => <UserMenu user={u()} sessionToken={sessionToken()} />}
              </Show>
            </Suspense>
          </div>
        </div>
      </header>
    </div>
  );
}
