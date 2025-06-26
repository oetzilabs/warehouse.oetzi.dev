import { CustomersList } from "@/components/lists/customers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getCustomers } from "@/lib/api/customers";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: () => {
    getAuthenticatedUser();
    getCustomers();
  },
} as RouteDefinition;

export default function CustomersPage() {
  const data = createAsync(() => getCustomers(), { deferStream: true });

  return (
    <Show when={data()}>
      {(customersList) => (
        <div class="container flex flex-col grow py-8">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full ">
                <h1 class="font-semibold leading-none">Customers</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getCustomers.keyFor()), {
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
                        Create New
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Upload class="size-4" />
                        Import
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CustomersList data={customersList} />
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
