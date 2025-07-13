import { CustomersList } from "@/components/lists/customers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCustomers } from "@/lib/api/customers";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import UsersRound from "lucide-solid/icons/users-round";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async () => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const customers = await getCustomers();
    return { user, sessionToken, customers };
  },
} as RouteDefinition;

export default function CustomersPage() {
  const data = createAsync(() => getCustomers(), { deferStream: true });

  return (
    <div class="flex flex-row w-full grow p-2 gap-2">
      <div class="w-full flex flex-row h-full">
        <div class="w-full flex flex-col gap-4">
          <div class="flex items-center gap-4 justify-between w-full ">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <UsersRound class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Customers</h1>
            </div>
            <div class="flex items-center gap-0">
              <Button
                size="icon"
                variant="outline"
                class="w-9 rounded-r-none bg-background"
                onClick={() => {
                  toast.promise(revalidate(getCustomers.key), {
                    loading: "Refreshing customers...",
                    success: "Customers refreshed",
                    error: "Failed to refresh customers",
                  });
                }}
              >
                <RotateCw class="size-4" />
              </Button>
              <DropdownMenu placement="bottom-end">
                <DropdownMenuTrigger as={Button} size="sm" class="pl-2.5 rounded-l-none">
                  <Plus class="size-4" />
                  Add Customer
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem as={A} href="/customers/new" class="cursor-pointer">
                    <Plus class="size-4" />
                    <span class="sr-only md:not-sr-only">Create New</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload class="size-4" />
                    Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Show when={data()}>{(customersList) => <CustomersList data={customersList} />}</Show>
        </div>
      </div>
      <div class="hidden md:flex w-px h-full bg-border"></div>
      <div class="w-0 md:w-[500px] h-full"></div>
    </div>
  );
}
