import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser, logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { A, revalidate, useAction, useSubmission } from "@solidjs/router";
import { type UserInfo } from "@warehouseoetzidev/core/src/entities/users";
import LifeBuoy from "lucide-solid/icons/life-buoy";
import LogIn from "lucide-solid/icons/log-in";
import LogOut from "lucide-solid/icons/log-out";
import MessagesSquare from "lucide-solid/icons/messages-square";
import Settings from "lucide-solid/icons/settings";
import User from "lucide-solid/icons/user";
import { Match, Show, Switch } from "solid-js";
import { toast } from "solid-sonner";

export default function UserMenu(props: { user: UserInfo; sessionToken?: string }) {
  const isLoggingOut = useSubmission(logout);
  const logoutAction = useAction(logout);

  return (
    <div class="w-max flex text-base gap-2">
      <Switch
        fallback={
          <div class="flex flex-row gap-2 items-center justify-end w-full">
            <A
              href="/login"
              class={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex flex-row gap-2 items-center justify-end w-full ",
              )}
            >
              <LogIn class="size-4" />
              Login
            </A>
          </div>
        }
      >
        <Match when={props.user !== null && props.sessionToken !== undefined && props.user}>
          {(s) => (
            <DropdownMenu placement="bottom-end" gutter={6}>
              <DropdownMenuTrigger as={Button} class="flex flex-row items-center justify-center size-8 p-1">
                <User class="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuGroupLabel class="font-normal p-0">
                    <div class="flex flex-col gap-1 p-2">
                      <p class="text-sm font-medium leading-none">{s().name}</p>
                      <p class="text-xs leading-none text-muted-foreground">{s().email}</p>
                      <Show
                        when={s().sessions.find((s) => s.access_token === props.sessionToken!)}
                        fallback={<p class="text-xs leading-none text-muted-foreground">No organization</p>}
                      >
                        {(sess) => (
                          <div class="flex flex-col gap-1">
                            <p class="text-xs leading-none text-muted-foreground">
                              {
                                // @ts-ignore
                                sess().org?.name ?? "no company"
                              }
                            </p>
                            <p class="text-xs leading-none text-muted-foreground">
                              {
                                // @ts-ignore
                                sess().wh?.name ?? "no warehouse"
                              }
                            </p>
                          </div>
                        )}
                      </Show>
                    </div>
                  </DropdownMenuGroupLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem as={A} class="cursor-pointer" href="/profile">
                    <User class="size-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem as={A} class="cursor-pointer" href="/messages">
                    <MessagesSquare class="size-4" />
                    <span>Messages</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem as={A} class="cursor-pointer" href="/profile/settings">
                    <Settings class="size-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LifeBuoy class="size-4" />
                  <span>Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  class="cursor-pointer text-red-500 hover:!text-red-500 hover:!bg-red-100 dark:hover:!text-white dark:hover:!bg-red-900"
                  disabled={isLoggingOut.pending}
                  onSelect={async () => {
                    toast.promise(logoutAction(), {
                      loading: "Logging out...",
                      success: "Logged out successfully.",
                      error: "Error logging out",
                    });
                    await revalidate([getAuthenticatedUser.key]);
                  }}
                >
                  <LogOut class="size-4" />
                  <span>Log out</span>
                  {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Match>
      </Switch>
    </div>
  );
}
