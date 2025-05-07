import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { A, createAsync } from "@solidjs/router";
import HomeIcon from "lucide-solid/icons/home";
import LogIn from "lucide-solid/icons/log-in";
import { For, Show, Suspense } from "solid-js";
import { cn } from "../lib/utils";
import ModeToggle from "./ModeToogle";
import { useBreadcrumbs } from "./providers/Breadcrumbs";
import { Button } from "./ui/button";
import UserMenu from "./UserMenu";

export function Header() {
  const { breadcrumbs, ready } = useBreadcrumbs();
  return (
    <div class="flex flex-col p-2 w-full">
      <header class="bg-neutral-50/[0.01] dark:bg-neutral-950/[0.01] backdrop-blur-md flex flex-col px-0 items-center justify-between border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <div class="flex flex-row w-full items-center justify-between px-4 py-2">
          <div class="flex flex-row items-center justify-start w-max gap-8 ">
            <A href="/" class="flex flex-row gap-4 items-center justify-center flex-1 w-max font-bold">
              WareHouse.
            </A>
            <div class="flex flex-row gap-4 items-center justify-start">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/" class="flex items-center gap-2">
                      <HomeIcon class="size-4" />
                      Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <Show
                    when={ready()}
                    fallback={
                      <>
                        <BreadcrumbSeparator> / </BreadcrumbSeparator>
                        <BreadcrumbItem>
                          <Skeleton class="w-20 h-4" />
                        </BreadcrumbItem>
                        <BreadcrumbSeparator> / </BreadcrumbSeparator>
                        <BreadcrumbItem>
                          <Skeleton class="w-16 h-4" />
                        </BreadcrumbItem>
                        <BreadcrumbSeparator> / </BreadcrumbSeparator>
                        <BreadcrumbItem>
                          <Skeleton class="w-20 h-4" />
                        </BreadcrumbItem>
                      </>
                    }
                  >
                    <For each={breadcrumbs()}>
                      {(b, index) => (
                        <>
                          <Show when={index() <= breadcrumbs().length - 1}>
                            <BreadcrumbSeparator> / </BreadcrumbSeparator>
                          </Show>
                          <Show
                            when={b.href}
                            fallback={
                              <BreadcrumbPage
                                class={cn({
                                  "text-foreground": b.active,
                                  "text-muted-foreground": !b.active,
                                  "cursor-default": index() === breadcrumbs().length - 1,
                                })}
                              >
                                {b.label}
                              </BreadcrumbPage>
                            }
                          >
                            <BreadcrumbItem>
                              <BreadcrumbLink
                                href={b.href}
                                class={cn({
                                  "text-foreground": b.active,
                                  "text-muted-foreground": !b.active,
                                  "cursor-default": index() === breadcrumbs().length - 1,
                                })}
                              >
                                {b.label}
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                          </Show>
                        </>
                      )}
                    </For>
                  </Show>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <div class="w-max items-center justify-end flex flex-row gap-2">
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
