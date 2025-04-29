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
import { getAuthenticatedSession, getAuthenticatedUser, logout, UserSession } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { useColorMode } from "@kobalte/core";
import { A, revalidate, useAction, useSubmission } from "@solidjs/router";
import Cloud from "lucide-solid/icons/cloud";
import LifeBuoy from "lucide-solid/icons/life-buoy";
import LogIn from "lucide-solid/icons/log-in";
import LogOut from "lucide-solid/icons/log-out";
import MessagesSquare from "lucide-solid/icons/messages-square";
import Moon from "lucide-solid/icons/moon";
import Settings from "lucide-solid/icons/settings";
import Sun from "lucide-solid/icons/sun";
import User from "lucide-solid/icons/user";
import Vault from "lucide-solid/icons/vault";
import { Match, Show, Switch } from "solid-js";
import { toast } from "solid-sonner";

export default function UserMenu(props: { session: UserSession }) {
  const isLoggingOut = useSubmission(logout);
  const logoutAction = useAction(logout);

  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <div class="w-max flex text-base gap-2">
      <Button
        size="icon"
        variant="outline"
        class="flex flex-row items-center justify-center p-2 size-8"
        onClick={() => {
          toggleColorMode();
        }}
      >
        <Show when={colorMode() === "light"} fallback={<Sun class="size-4" />}>
          <Moon class="size-4" />
        </Show>
      </Button>
      <Switch
        fallback={
          <div class="flex flex-row gap-2 items-center justify-end w-full">
            <A
              href="/auth/login"
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
        <Match when={props.session.user !== null && props.session}>
          {(s) => (
            <DropdownMenu placement="bottom-end" gutter={6}>
              <DropdownMenuTrigger as={Button} class="flex flex-row items-center justify-center size-8 p-1">
                <User class="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuGroupLabel class="font-normal">
                    <div class="flex flex-col space-y-1">
                      <p class="text-sm font-medium leading-none">{s().user!.name}</p>
                      <p class="text-xs leading-none text-muted-foreground">{s().user!.email}</p>
                      <Show
                        when={s().current_organization}
                        fallback={<p class="text-xs leading-none text-muted-foreground">No organization</p>}
                      >
                        {(o) => <p class="text-xs leading-none text-muted-foreground">{o().name}</p>}
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
                    await revalidate([getAuthenticatedUser.key, getAuthenticatedSession.key]);
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
