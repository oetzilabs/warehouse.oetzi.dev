import { A } from "@solidjs/router";
import { Suspense } from "solid-js";
import ModeToggle from "./ModeToogle";
import UserMenu from "./UserMenu";

export function Header() {
  return (
    <div class="flex flex-col w-full h-content">
      <header class="bg-background flex flex-col px-0 items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
        <div class="flex flex-row w-full items-center justify-between px-2.5 py-2">
          <div class="flex flex-row items-center justify-start w-max gap-4 ">
            <A
              href="/"
              class="flex flex-row gap-4 items-center justify-center flex-1 w-max font-[Pacifico] px-2 text-lg text-indigo-600 dark:text-indigo-500"
            >
              warehouse.
            </A>
            <div class="flex flex-row gap-4 items-center justify-start"></div>
          </div>
          <div class="w-max items-center justify-end flex flex-row gap-0">
            <ModeToggle />
            <Suspense fallback={<div>Loading...</div>}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
    </div>
  );
}
