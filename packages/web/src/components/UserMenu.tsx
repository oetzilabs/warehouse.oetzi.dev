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
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthenticatedUser, getSessionToken, logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { A, revalidate, useAction, useSubmission } from "@solidjs/router";
import { type UserInfo } from "@warehouseoetzidev/core/src/entities/users";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import LifeBuoy from "lucide-solid/icons/life-buoy";
import LogOut from "lucide-solid/icons/log-out";
import MessagesSquare from "lucide-solid/icons/messages-square";
import Settings from "lucide-solid/icons/settings";
import User from "lucide-solid/icons/user";
import { Match, Show, Switch } from "solid-js";
import { toast } from "solid-sonner";
import { useUser } from "./providers/User";

export default function UserMenu() {
  const user = useUser();
  const logoutAction = useAction(logout);
  const isLoggingOut = useSubmission(logout);

  return (
    <div class="w-max flex text-base gap-2">
      <Switch
        fallback={
          <div class="flex flex-row gap-2 items-center justify-end w-full">
            <Button as={A} href="/login" size="sm" class="rounded-l-none">
              Login
              <ArrowUpRight class="size-4" />
            </Button>
          </div>
        }
      >
        <Match when={!user.ready()}>
          <Skeleton class="w-24 h-8" />
        </Match>
        <Match when={user.ready() && user.user() !== null && user.session() !== null && user.user()}>
          {(s) => (
            <DropdownMenu placement="bottom-end" gutter={6}>
              <DropdownMenuTrigger
                as={Button}
                class="flex flex-row items-center justify-center h-8 px-3 rounded-l-none"
              >
                {s().name}
                <User class="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuGroupLabel class="font-normal p-0">
                    <div class="flex flex-col gap-1 p-2">
                      <p class="text-sm font-medium leading-none">{s().name}</p>
                      <p class="text-xs leading-none text-muted-foreground">{s().email}</p>
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
                  <DropdownMenuItem as={A} class="cursor-pointer" href="/settings">
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
                    await revalidate([getAuthenticatedUser.key, getSessionToken.key]);
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
